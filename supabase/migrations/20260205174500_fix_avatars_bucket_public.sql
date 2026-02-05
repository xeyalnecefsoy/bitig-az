-- Make sure avatars bucket is public
update storage.buckets
set public = true
where id = 'avatars';

-- Make sure covers bucket is public
update storage.buckets
set public = true
where id = 'covers';

-- Ensure policies exist (idempotent policy creation is tricky, so we drop and recreate to be safe)
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Cover images are publicly accessible." on storage.objects;
create policy "Cover images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'covers' );

-- Ensure unauthenticated users can download avatars (sometimes "select" isn't enough for direct download via URL if not public)
-- But setting public = true on the bucket is the key for getPublicUrl() to work.
