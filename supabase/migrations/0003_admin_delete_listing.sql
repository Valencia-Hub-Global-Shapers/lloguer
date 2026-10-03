-- Admins may permanently remove a listing. The row delete cascades its
-- moderation events and view counts (both reference listings on delete
-- cascade); the server action then removes the photo files from Storage, which
-- the existing listing_photos_admin_delete policy already allows.

grant delete on listings to authenticated;

create policy listings_delete on listings
  for delete to authenticated
  using (public.is_admin());
