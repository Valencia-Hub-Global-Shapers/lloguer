-- ---------------------------------------------------------------------------
-- Anonymous submissions: anyone can publish without an account.
--
--  * Listings no longer need an owner. Ownership is proven by an edit token:
--    the app generates a random token, shows/emails it to the poster once and
--    stores only its sha256 hash (edit_token_hash).
--  * anon has NO table privileges. All anonymous writes go through the
--    security-definer functions below, which still send every listing through
--    manual moderation (status = 'pending').
--  * An optional shared "submit gate" secret (private_settings) lets the app
--    ensure submissions come through the server action (captcha + IP rate
--    limit) instead of straight at the REST API with the public anon key.
-- ---------------------------------------------------------------------------

alter table listings alter column owner_id drop not null;
alter table listings add column contact_email text;
alter table listings add column edit_token_hash text;

create index listings_edit_token_idx on listings (id, edit_token_hash);
create index listings_contact_email_idx on listings (contact_email, created_at);

-- Moderation events written by anonymous posters have no actor.
alter table moderation_events alter column actor_id drop not null;

-- Direct inserts are admin-only now; everyone else uses submit_listing().
drop policy listings_insert on listings;
create policy listings_insert on listings
  for insert with check (public.is_admin() and status in ('pending', 'draft', 'approved'));

-- ---------------------------------------------------------------------------
-- Private key/value settings. RLS on, no policies, no grants: only
-- security-definer functions can read it.
-- ---------------------------------------------------------------------------
create table private_settings (
  key text primary key,
  value text not null
);
alter table private_settings enable row level security;

-- Raises 'forbidden' unless p_gate matches the configured submit gate.
-- When no gate is configured (local dev) submissions are open.
create or replace function public.check_submit_gate(p_gate text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
begin
  select value into expected from private_settings where key = 'submit_gate';
  if expected is not null and expected is distinct from p_gate then
    raise exception 'forbidden';
  end if;
end;
$$;

revoke all on function public.check_submit_gate(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_listing(): create a pending listing. Returns the new id.
-- ---------------------------------------------------------------------------
create or replace function public.submit_listing(
  p_gate text,
  p_token_hash text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  email text := lower(trim(p_payload ->> 'contact_email'));
  photo text;
begin
  perform public.check_submit_gate(p_gate);

  if p_token_hash is null or length(p_token_hash) <> 64 then
    raise exception 'invalid_token';
  end if;
  if email is null or email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  -- Anonymous photos may only reference the shared anonymous upload folder
  for photo in select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb)) loop
    if photo not like 'anon/%' or photo like '%..%' then
      raise exception 'invalid_photo';
    end if;
  end loop;

  -- Per-email throttle (the app also rate limits per IP)
  if (select count(*) from listings
      where contact_email = email and created_at > now() - interval '1 day') >= 5 then
    raise exception 'rate_limited';
  end if;

  insert into listings (
    type, status, price, neighborhood, municipality, location,
    flatmates, preferred_gender, description, available_from, bills_included,
    deposit, room_type, pets, smokers, tenant_pref, contact_external,
    contact_whatsapp, bathrooms, bedrooms, photos, contact_email, edit_token_hash
  ) values (
    (p_payload ->> 'type')::listing_type,
    'pending',
    (p_payload ->> 'price')::int,
    p_payload ->> 'neighborhood',
    coalesce(p_payload ->> 'municipality', 'València'),
    st_setsrid(
      st_makepoint((p_payload ->> 'lng')::float8, (p_payload ->> 'lat')::float8), 4326
    )::geography,
    (p_payload ->> 'flatmates')::int,
    coalesce((p_payload ->> 'preferred_gender')::gender_pref, 'any'),
    coalesce(p_payload ->> 'description', ''),
    (p_payload ->> 'available_from')::date,
    coalesce((p_payload ->> 'bills_included')::boolean, false),
    (p_payload ->> 'deposit')::int,
    (p_payload ->> 'room_type')::room_type,
    coalesce((p_payload ->> 'pets')::boolean, false),
    coalesce((p_payload ->> 'smokers')::boolean, false),
    coalesce((p_payload ->> 'tenant_pref')::tenant_pref, 'any'),
    p_payload ->> 'contact_external',
    p_payload ->> 'contact_whatsapp',
    (p_payload ->> 'bathrooms')::int,
    (p_payload ->> 'bedrooms')::int,
    array(select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb))),
    email,
    p_token_hash
  )
  returning id into new_id;

  insert into moderation_events (listing_id, actor_id, action)
  values (new_id, null, 'submitted');

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_listing_by_token(): poster view of their own listing (any status except
-- deleted), including the exact coordinates and the latest rejection comment.
-- ---------------------------------------------------------------------------
create or replace function public.get_listing_by_token(p_id uuid, p_token_hash text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select
    (to_jsonb(l) - 'location' - 'edit_token_hash' - 'owner_id')
    || jsonb_build_object(
      'lat', st_y(l.location::geometry),
      'lng', st_x(l.location::geometry),
      'rejection_comment', (
        select m.comment from moderation_events m
        where m.listing_id = l.id and m.action = 'rejected'
        order by m.created_at desc limit 1
      )
    )
  from listings l
  where l.id = p_id
    and l.edit_token_hash is not null
    and l.edit_token_hash = p_token_hash
    and l.status <> 'deleted';
$$;

-- ---------------------------------------------------------------------------
-- update_listing_by_token(): edit content. Always returns the listing to
-- moderation (pending) and clears the live window.
-- ---------------------------------------------------------------------------
create or replace function public.update_listing_by_token(
  p_gate text,
  p_id uuid,
  p_token_hash text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status listing_status;
  photo text;
begin
  perform public.check_submit_gate(p_gate);

  select status into old_status from listings
  where id = p_id and edit_token_hash is not null and edit_token_hash = p_token_hash
    and status <> 'deleted';
  if not found then
    raise exception 'not_found';
  end if;

  for photo in select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb)) loop
    if photo not like 'anon/%' or photo like '%..%' then
      raise exception 'invalid_photo';
    end if;
  end loop;

  perform set_config('mylloguer.internal', '1', true);

  update listings set
    type = (p_payload ->> 'type')::listing_type,
    status = 'pending',
    price = (p_payload ->> 'price')::int,
    neighborhood = p_payload ->> 'neighborhood',
    municipality = coalesce(p_payload ->> 'municipality', 'València'),
    location = st_setsrid(
      st_makepoint((p_payload ->> 'lng')::float8, (p_payload ->> 'lat')::float8), 4326
    )::geography,
    flatmates = (p_payload ->> 'flatmates')::int,
    preferred_gender = coalesce((p_payload ->> 'preferred_gender')::gender_pref, 'any'),
    description = coalesce(p_payload ->> 'description', ''),
    available_from = (p_payload ->> 'available_from')::date,
    bills_included = coalesce((p_payload ->> 'bills_included')::boolean, false),
    deposit = (p_payload ->> 'deposit')::int,
    room_type = (p_payload ->> 'room_type')::room_type,
    pets = coalesce((p_payload ->> 'pets')::boolean, false),
    smokers = coalesce((p_payload ->> 'smokers')::boolean, false),
    tenant_pref = coalesce((p_payload ->> 'tenant_pref')::tenant_pref, 'any'),
    contact_external = p_payload ->> 'contact_external',
    contact_whatsapp = p_payload ->> 'contact_whatsapp',
    bathrooms = (p_payload ->> 'bathrooms')::int,
    bedrooms = (p_payload ->> 'bedrooms')::int,
    photos = array(select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb))),
    approved_at = null,
    expires_at = null,
    published_version = published_version + 1
  where id = p_id;

  insert into moderation_events (listing_id, actor_id, action)
  values (
    p_id,
    null,
    (case when old_status in ('draft', 'rejected', 'expired') then 'republished' else 'edited' end)::moderation_action
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- set_listing_status_by_token(): deactivate | republish | delete
--   deactivate: approved -> draft      republish: draft/rejected/expired -> pending
--   delete: any -> deleted (soft delete)
-- ---------------------------------------------------------------------------
create or replace function public.set_listing_status_by_token(
  p_gate text,
  p_id uuid,
  p_token_hash text,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status listing_status;
begin
  perform public.check_submit_gate(p_gate);

  select status into old_status from listings
  where id = p_id and edit_token_hash is not null and edit_token_hash = p_token_hash
    and status <> 'deleted';
  if not found then
    raise exception 'not_found';
  end if;

  perform set_config('mylloguer.internal', '1', true);

  if p_action = 'deactivate' and old_status = 'approved' then
    update listings set status = 'draft', approved_at = null, expires_at = null where id = p_id;
    insert into moderation_events (listing_id, actor_id, action) values (p_id, null, 'deactivated');
  elsif p_action = 'republish' and old_status in ('draft', 'rejected', 'expired') then
    update listings
    set status = 'pending', approved_at = null, expires_at = null,
        published_version = published_version + 1
    where id = p_id;
    insert into moderation_events (listing_id, actor_id, action) values (p_id, null, 'republished');
  elsif p_action = 'delete' then
    update listings set status = 'deleted', deleted_at = now() where id = p_id;
    insert into moderation_events (listing_id, actor_id, action) values (p_id, null, 'deleted');
  else
    raise exception 'invalid_status_transition';
  end if;
end;
$$;

grant execute on function public.submit_listing(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_listing_by_token(uuid, text) to anon, authenticated;
grant execute on function public.update_listing_by_token(text, uuid, text, jsonb) to anon, authenticated;
grant execute on function public.set_listing_status_by_token(text, uuid, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: anonymous photo uploads go to listing-photos/anon/<draft>/<file>.
-- Size and mime limits come from the bucket itself.
-- ---------------------------------------------------------------------------
create policy listing_photos_anon_insert on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = 'anon'
  );
