-- Profiles are created by the on_auth_user_created trigger. Any auth user
-- created before that trigger existed (or by hand from the dashboard) has no
-- profile row, so is_admin can never be set and the app sees no admin. Backfill
-- the missing rows and make sure the trigger is installed. Idempotent.

insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
