-- ---------------------------------------------------------------------------
-- MyLloguer baseline schema.
--
-- Open shared-flat classifieds for Spain: anyone can publish without an
-- account, every listing goes through manual moderation, and approved listings
-- expire on their own.
--
--  * Posters have no accounts. Ownership is proven by an edit token: the app
--    generates a random token, shows/emails it once and stores only its sha256
--    (listings.edit_token_hash).
--  * `anon` has NO table privileges. Anonymous writes go through the
--    security-definer functions at the bottom of this file.
--  * Admins sign in (Supabase Auth, profiles.is_admin) and moderate through
--    RLS-protected table access.
--  * An optional shared "submit gate" secret (private_settings) makes the
--    anonymous functions callable only from the server actions (captcha and
--    IP rate limiting) instead of straight from the REST API.
-- ---------------------------------------------------------------------------

-- Extensions -----------------------------------------------------------------
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- pg_cron is optional locally; public reads also filter expires_at.
do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron extension not available, skipping';
end $$;

-- Enums ----------------------------------------------------------------------
create type listing_type as enum ('room', 'full_flat');
create type listing_status as enum ('draft', 'pending', 'approved', 'rejected', 'expired');
create type gender_pref as enum ('any', 'female', 'male', 'non_binary');
create type room_type as enum ('single', 'double', 'shared');
create type tenant_pref as enum ('any', 'students', 'workers');
create type moderation_action as enum ('submitted', 'approved', 'rejected', 'edited', 'deactivated', 'republished');

-- Tables ---------------------------------------------------------------------

-- Admin profiles (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  type listing_type not null,
  status listing_status not null default 'pending',
  price int not null check (price > 0),
  neighborhood text,
  municipality text not null,
  -- Exact point. NEVER exposed via public views/API.
  location geography(Point, 4326) not null,
  -- Truncated to ~100m grid at write time (trigger). Safe to expose.
  public_lat numeric(7, 4) not null,
  public_lng numeric(7, 4) not null,
  flatmates int check (flatmates >= 0),
  preferred_gender gender_pref not null default 'any',
  description text not null default '',
  available_from date,
  bills_included boolean not null default false,
  deposit int check (deposit >= 0),
  room_type room_type,
  pets boolean not null default false,
  smokers boolean not null default false,
  tenant_pref tenant_pref not null default 'any',
  contact_external text,
  contact_whatsapp text,
  bathrooms int check (bathrooms >= 0),
  bedrooms int check (bedrooms >= 0),
  views_count int not null default 0,
  photos text[] not null default '{}',
  -- Public contact email, shown on the listing like the WhatsApp number. Optional.
  contact_email text,
  -- Private and independent from the public contact: where the poster's edit
  -- link is sent. Never exposed by public views.
  internal_email text,
  -- Private: sha256 of the poster's edit token.
  edit_token_hash text,
  expires_at timestamptz,
  approved_at timestamptz,
  published_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Spain only: mainland + Balearics + Ceuta/Melilla box, or the Canary Islands box.
  -- Keep in sync with src/lib/geo.ts.
  constraint listings_in_spain check (
    (st_y(location::geometry) between 35.1 and 43.9 and st_x(location::geometry) between -9.6 and 4.5)
    or (st_y(location::geometry) between 27.4 and 29.6 and st_x(location::geometry) between -18.4 and -13.2)
  ),
  -- At least one public way to get in touch: WhatsApp or email.
  -- contact_external (a link) is always optional.
  constraint listings_contact_required check (contact_whatsapp is not null or contact_email is not null),
  constraint listings_bedrooms_required_for_flat check (type = 'room' or bedrooms is not null),
  constraint listings_room_type_required_for_room check (type = 'full_flat' or room_type is not null)
);

create index listings_public_idx on listings (status, expires_at) where status = 'approved';
create index listings_location_gix on listings using gist (location);
create index listings_edit_token_idx on listings (id, edit_token_hash);
create index listings_internal_email_idx on listings (internal_email, created_at);

-- Moderation history (append-only). actor_id is null for anonymous posters.
create table moderation_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  actor_id uuid references profiles (id),
  action moderation_action not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint moderation_events_reject_comment check (action <> 'rejected' or comment is not null)
);

create index moderation_events_listing_idx on moderation_events (listing_id, created_at desc);

-- Raw view events, deduped per viewer via viewer_hash
create table listing_views (
  id bigint generated always as identity primary key,
  listing_id uuid not null references listings (id) on delete cascade,
  viewer_hash text not null,
  created_at timestamptz not null default now()
);

create unique index listing_views_dedupe_idx on listing_views (listing_id, viewer_hash);

-- Private key/value settings. RLS on, no policies, no grants: only
-- security-definer functions can read it.
create table private_settings (
  key text primary key,
  value text not null
);

-- Photo files waiting to be removed from Storage. Only the Storage API really
-- deletes a file (deleting storage.objects rows in SQL leaves the blob behind),
-- and this project has no service-role key. So erasing a listing queues its
-- photo paths here and a narrow storage policy lets the server delete exactly
-- these files. RLS on, no policies: only the functions below touch it.
create table photo_deletion_queue (
  path text primary key,
  queued_at timestamptz not null default now()
);

-- Helpers and triggers -------------------------------------------------------

-- Stable helper to avoid per-row subqueries in policies
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Copy auth.users data into profiles on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger listings_set_updated_at
  before update on listings
  for each row execute function public.set_updated_at();

-- Snap public coords to a ~100m grid at write time (never at read time)
create or replace function public.snap_public_coords()
returns trigger
language plpgsql
as $$
begin
  new.public_lat := round(st_y(new.location::geometry)::numeric, 3);
  new.public_lng := round(st_x(new.location::geometry)::numeric, 3);
  return new;
end;
$$;

create trigger listings_snap_public_coords
  before insert or update of location on listings
  for each row execute function public.snap_public_coords();

-- Prevent privilege escalation: only admins may change is_admin
create or replace function public.guard_profile_admin_flag()
returns trigger
language plpgsql
as $$
begin
  -- auth.uid() is null for trusted contexts (seeds, SQL console)
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_admin_flag
  before update on profiles
  for each row execute function public.guard_profile_admin_flag();

-- View counting with per-viewer dedupe. Callable by anon; rate-limited upstream.
create or replace function public.increment_listing_view(p_listing_id uuid, p_viewer_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into listing_views (listing_id, viewer_hash)
  values (p_listing_id, p_viewer_hash)
  on conflict (listing_id, viewer_hash) do nothing;

  if found then
    update listings set views_count = views_count + 1 where id = p_listing_id;
  end if;
end;
$$;

-- Expiry: approved => expired once expires_at passes. Run by cron and/or by hand.
create or replace function public.expire_listings()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update listings
  set status = 'expired'
  where status = 'approved' and expires_at is not null and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Hourly expiry job. Skipped silently when pg_cron is unavailable (local dev).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('expire-listings-hourly', '0 * * * *', 'select public.expire_listings()');
  end if;
exception when others then
  raise notice 'could not schedule expiry cron: %', sqlerrm;
end $$;

-- Row level security ---------------------------------------------------------
alter table profiles enable row level security;
alter table listings enable row level security;
alter table moderation_events enable row level security;
alter table listing_views enable row level security;
alter table private_settings enable row level security;
alter table photo_deletion_queue enable row level security;

-- profiles: self + admin. Public display data goes through public_profiles.
create policy profiles_select on profiles
  for select using (auth.uid() = id or public.is_admin());

create policy profiles_update on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- listings: admin only. Public reads go through public_listings; posters go
-- through the token functions below. No delete policy: soft-delete only.
create policy listings_select on listings
  for select using (public.is_admin());

create policy listings_insert on listings
  for insert with check (public.is_admin());

create policy listings_update on listings
  for update using (public.is_admin()) with check (public.is_admin());

-- moderation_events: admin only
create policy moderation_events_select on moderation_events
  for select using (public.is_admin());

create policy moderation_events_insert on moderation_events
  for insert with check (public.is_admin() and actor_id = auth.uid());

-- listing_views: admin read only. Writes only via increment_listing_view().
create policy listing_views_select on listing_views
  for select using (public.is_admin());

-- Public-safe views ----------------------------------------------------------
-- Security definer on purpose: expose only safe columns and bypass RLS.
-- Exact location, contact_email and edit_token_hash are NEVER included.
create or replace view public.public_listings
with (security_invoker = false) as
select
  id,
  type,
  status,
  price,
  neighborhood,
  municipality,
  public_lat,
  public_lng,
  flatmates,
  preferred_gender,
  description,
  available_from,
  bills_included,
  deposit,
  room_type,
  pets,
  smokers,
  tenant_pref,
  contact_external,
  contact_whatsapp,
  contact_email,
  bathrooms,
  bedrooms,
  views_count,
  photos,
  published_version,
  created_at
from listings
where status = 'approved' and (expires_at is null or expires_at > now());

-- Places (municipality + neighborhood) that currently have live listings, with
-- their bounding box. Powers the place filter and "fly to" on the map.
create or replace view public.public_places
with (security_invoker = false) as
select
  municipality,
  neighborhood,
  count(*)::int as listings,
  min(public_lat) as min_lat,
  min(public_lng) as min_lng,
  max(public_lat) as max_lat,
  max(public_lng) as max_lng
from listings
where status = 'approved' and (expires_at is null or expires_at > now())
group by municipality, neighborhood;

-- Map pins for a viewport, clustered on a fixed grid so the payload stays small
-- however many listings exist. p_cell is the grid cell size in degrees of
-- longitude (0 = return every listing as its own pin). Cells holding a single
-- listing come back as that listing; busier cells come back as one row with
-- id = null and count = number of listings. Reads only public_listings, so it
-- is security invoker and exposes nothing new.
create or replace function public.browse_pins(
  p_min_lat float8,
  p_min_lng float8,
  p_max_lat float8,
  p_max_lng float8,
  p_cell float8 default 0,
  p_type listing_type default null,
  p_min_price int default null,
  p_max_price int default null,
  p_city text default null,
  p_hood text default null,
  p_gender gender_pref default null,
  p_bills boolean default null,
  p_pets boolean default null,
  p_smokers boolean default null,
  p_max_flatmates int default null,
  p_avail date default null,
  p_limit int default 1000
)
returns table (id uuid, type listing_type, price int, lat float8, lng float8, count int)
language sql
stable
set search_path = public
as $$
  with f as (
    select l.id, l.type, l.price, l.public_lat::float8 as lat, l.public_lng::float8 as lng
    from public_listings l
    where l.public_lat between p_min_lat and p_max_lat
      and l.public_lng between p_min_lng and p_max_lng
      and (p_type is null or l.type = p_type)
      and (p_min_price is null or l.price >= p_min_price)
      and (p_max_price is null or l.price <= p_max_price)
      and (p_city is null or l.municipality = p_city)
      and (p_hood is null or l.neighborhood = p_hood)
      and (p_gender is null or l.preferred_gender in ('any', p_gender))
      and (p_bills is not true or l.bills_included)
      and (p_pets is not true or l.pets)
      and (p_smokers is not true or l.smokers)
      and (p_max_flatmates is null or l.flatmates <= p_max_flatmates)
      and (p_avail is null or l.available_from is null or l.available_from <= p_avail)
  ),
  cells as (
    select
      f.*,
      -- Latitude cells shrink with cos(lat) so they look square on a Web Mercator map
      floor(f.lat / nullif(p_cell * cos(radians((p_min_lat + p_max_lat) / 2)), 0)) as cy,
      floor(f.lng / nullif(p_cell, 0)) as cx
    from f
  ),
  counted as (
    select c.*, count(*) over (partition by c.cy, c.cx) as n from cells c
  )
  (
    select c.id, c.type, c.price, c.lat, c.lng, 1 as count
    from counted c
    where p_cell <= 0 or c.n = 1
  )
  union all
  (
    select null::uuid, null::listing_type, null::int, avg(c.lat), avg(c.lng), count(*)::int
    from counted c
    where p_cell > 0 and c.n > 1
    group by c.cy, c.cx
  )
  limit p_limit;
$$;

create or replace view public.public_profiles
with (security_invoker = false) as
select id, full_name, avatar_url
from profiles;

-- Privileges -----------------------------------------------------------------
-- Table-level grants for API roles; row access is still governed by RLS.
-- anon gets no table access at all: only the views and the functions.
grant usage on schema public to anon, authenticated;

grant select on public.public_listings to anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
grant select on public.public_places to anon, authenticated;
grant execute on function public.browse_pins to anon, authenticated;

grant select, insert, update on listings to authenticated;
grant select, update on profiles to authenticated;
grant select, insert on moderation_events to authenticated;
grant select on listing_views to authenticated;

grant execute on function public.increment_listing_view(uuid, text) to anon, authenticated;

-- Storage: listing-photos bucket -----------------------------------------------
-- Public read. Anyone may upload under anon/<draft-uuid>/<file>; size and mime
-- limits come from the bucket. Only admins can delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy listing_photos_public_read on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy listing_photos_anon_insert on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = 'anon'
  );

create policy listing_photos_admin_delete on storage.objects
  for delete using (bucket_id = 'listing-photos' and public.is_admin());

-- Photos of erased listings (or removed during an edit) can be deleted by the
-- server through the Storage API. Security definer so the policy can read the
-- queue, which anon cannot.
create or replace function public.photo_pending_deletion(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from photo_deletion_queue where path = p_name);
$$;

create policy listing_photos_pending_delete on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'listing-photos' and public.photo_pending_deletion(name));

-- Forget queued paths whose files are really gone from Storage. A path whose
-- file still exists stays queued, so calling this does not skip any deletion.
create or replace function public.ack_photo_deletion()
returns void
language sql
security definer
set search_path = public
as $$
  delete from photo_deletion_queue q
  where not exists (
    select 1 from storage.objects o where o.bucket_id = 'listing-photos' and o.name = q.path
  );
$$;

grant execute on function public.photo_pending_deletion(text) to anon, authenticated;
grant execute on function public.ack_photo_deletion() to anon, authenticated;

-- Anonymous submission API ---------------------------------------------------

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

-- Create a pending listing. Returns the new id.
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
  internal text := nullif(lower(trim(p_payload ->> 'internal_email')), '');
  email text := nullif(lower(trim(p_payload ->> 'contact_email')), '');
  whatsapp text := nullif(trim(p_payload ->> 'contact_whatsapp'), '');
  photo text;
begin
  perform public.check_submit_gate(p_gate);

  if p_token_hash is null or length(p_token_hash) <> 64 then
    raise exception 'invalid_token';
  end if;
  -- The private email (edit link) is mandatory; the public one is optional.
  if internal is null or internal !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if email is not null and email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  if email is null and whatsapp is null then
    raise exception 'contact_required';
  end if;

  -- Anonymous photos may only reference the shared anonymous upload folder
  for photo in select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb)) loop
    if photo not like 'anon/%' or photo like '%..%' then
      raise exception 'invalid_photo';
    end if;
  end loop;

  -- Per-poster throttle (the app also rate limits per IP)
  if (select count(*) from listings
      where created_at > now() - interval '1 day'
        and (internal_email = internal
          or (whatsapp is not null and contact_whatsapp = whatsapp))) >= 5 then
    raise exception 'rate_limited';
  end if;

  insert into listings (
    type, status, price, neighborhood, municipality, location,
    flatmates, preferred_gender, description, available_from, bills_included,
    deposit, room_type, pets, smokers, tenant_pref, contact_external,
    contact_whatsapp, bathrooms, bedrooms, photos, contact_email, internal_email, edit_token_hash
  ) values (
    (p_payload ->> 'type')::listing_type,
    'pending',
    (p_payload ->> 'price')::int,
    p_payload ->> 'neighborhood',
    p_payload ->> 'municipality',
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
    whatsapp,
    (p_payload ->> 'bathrooms')::int,
    (p_payload ->> 'bedrooms')::int,
    array(select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb))),
    email,
    internal,
    p_token_hash
  )
  returning id into new_id;

  insert into moderation_events (listing_id, actor_id, action)
  values (new_id, null, 'submitted');

  return new_id;
end;
$$;

-- Poster view of their own listing (any status), including the
-- exact coordinates and the latest rejection comment.
create or replace function public.get_listing_by_token(p_id uuid, p_token_hash text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select
    (to_jsonb(l) - 'location' - 'edit_token_hash')
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
    and l.edit_token_hash = p_token_hash;
$$;

-- Edit content. Always returns the listing to moderation (pending) and clears
-- the live window.
create or replace function public.update_listing_by_token(
  p_gate text,
  p_id uuid,
  p_token_hash text,
  p_payload jsonb
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status listing_status;
  old_photos text[];
  new_photos text[] := array(select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb)));
  removed text[];
  new_email text := nullif(lower(trim(p_payload ->> 'contact_email')), '');
  photo text;
begin
  perform public.check_submit_gate(p_gate);

  select status, photos into old_status, old_photos from listings
  where id = p_id and edit_token_hash is not null and edit_token_hash = p_token_hash;
  if not found then
    raise exception 'not_found';
  end if;

  if new_email is not null and new_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  for photo in select jsonb_array_elements_text(coalesce(p_payload -> 'photos', '[]'::jsonb)) loop
    if photo not like 'anon/%' or photo like '%..%' then
      raise exception 'invalid_photo';
    end if;
  end loop;

  update listings set
    type = (p_payload ->> 'type')::listing_type,
    status = 'pending',
    price = (p_payload ->> 'price')::int,
    neighborhood = p_payload ->> 'neighborhood',
    municipality = p_payload ->> 'municipality',
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
    contact_whatsapp = nullif(trim(p_payload ->> 'contact_whatsapp'), ''),
    contact_email = nullif(lower(trim(p_payload ->> 'contact_email')), ''),
    bathrooms = (p_payload ->> 'bathrooms')::int,
    bedrooms = (p_payload ->> 'bedrooms')::int,
    photos = new_photos,
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

  -- Photos the poster dropped are no longer referenced: queue them for deletion
  removed := array(select unnest(old_photos) except select unnest(new_photos));
  insert into photo_deletion_queue (path) select unnest(removed) on conflict do nothing;
  return removed;
end;
$$;

-- deactivate: approved -> draft      republish: draft/rejected/expired -> pending
-- delete: ERASES the listing (contact data, moderation history, view counts) and
-- queues its photos for deletion. Returns the photo paths the caller must now
-- remove through the Storage API (empty for the other actions).
create or replace function public.set_listing_status_by_token(
  p_gate text,
  p_id uuid,
  p_token_hash text,
  p_action text
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status listing_status;
  old_photos text[];
begin
  perform public.check_submit_gate(p_gate);

  select status, photos into old_status, old_photos from listings
  where id = p_id and edit_token_hash is not null and edit_token_hash = p_token_hash;
  if not found then
    raise exception 'not_found';
  end if;

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
    insert into photo_deletion_queue (path) select unnest(old_photos) on conflict do nothing;
    -- moderation_events and listing_views go with it (on delete cascade)
    delete from listings where id = p_id;
    return old_photos;
  else
    raise exception 'invalid_status_transition';
  end if;
  return '{}';
end;
$$;

grant execute on function public.submit_listing(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_listing_by_token(uuid, text) to anon, authenticated;
grant execute on function public.update_listing_by_token(text, uuid, text, jsonb) to anon, authenticated;
grant execute on function public.set_listing_status_by_token(text, uuid, text, text) to anon, authenticated;
