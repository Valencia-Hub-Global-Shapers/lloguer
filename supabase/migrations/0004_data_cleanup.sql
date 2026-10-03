-- ---------------------------------------------------------------------------
-- Background cleanup, driven by the scheduled API route /api/cron/cleanup
-- (Vercel Cron). The route authenticates with CRON_SECRET (Vercel sends it as
-- the Authorization header) and passes it as the gate below. Configured the
-- same way as submit_gate: insert the value into private_settings.
-- ---------------------------------------------------------------------------

-- Like check_submit_gate, but for the scheduled job. Open when no row exists.
create or replace function public.check_cron_gate(p_gate text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
begin
  select value into expected from private_settings where key = 'cron_gate';
  if expected is not null and expected is distinct from p_gate then
    raise exception 'forbidden';
  end if;
end;
$$;

revoke all on function public.check_cron_gate(text) from public, anon, authenticated;

-- Permanently erase listings expired for over a month: queue their photos for
-- file deletion (the route removes the files and acks the queue) and delete
-- the rows; moderation events and view counts go with them (on delete cascade).
-- Returns the photo paths the caller must now remove from Storage.
create or replace function public.purge_expired_listings(p_gate text)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  paths text[];
begin
  perform public.check_cron_gate(p_gate);

  select coalesce(array_agg(photo), '{}'::text[])
  into paths
  from (
    select unnest(photos) as photo
    from listings
    where status = 'expired'
      and expires_at is not null
      and expires_at < now() - interval '30 days'
  ) p;

  insert into photo_deletion_queue (path)
    select unnest(paths)
    on conflict do nothing;

  delete from listings
  where status = 'expired'
    and expires_at is not null
    and expires_at < now() - interval '30 days';

  return paths;
end;
$$;

-- Paths still waiting in the deletion queue (retry failed file deletions).
create or replace function public.pending_photo_paths(p_gate text)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  paths text[];
begin
  perform public.check_cron_gate(p_gate);
  select coalesce(array_agg(path), '{}'::text[]) into paths from photo_deletion_queue;
  return paths;
end;
$$;

grant execute on function public.purge_expired_listings(text) to anon, authenticated;
grant execute on function public.pending_photo_paths(text) to anon, authenticated;

-- Whether a file is no longer referenced by any listing (photos live only in
-- listings.photos), so the storage sweep below can tell orphans from drafts.
create or replace function public.photo_unreferenced(p_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from listings where photos @> array[p_name]
  );
$$;

grant execute on function public.photo_unreferenced(text) to anon, authenticated;

-- Sweep anonymous uploads that were never submitted and are old enough.
create policy listing_photos_anon_sweep on storage.objects
  for delete to anon, authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = 'anon'
    and created_at < now() - interval '2 days'
    and public.photo_unreferenced(name)
  );
