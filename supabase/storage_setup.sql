-- Create storage buckets
insert into storage.buckets (id, name, public)
values 
  ('audiobook-covers', 'audiobook-covers', true),
  ('avatars', 'avatars', true);

-- Allow public read access to audiobook covers
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'audiobook-covers' );

-- Allow authenticated users to upload audiobook covers
create policy "Authenticated users can upload audiobook covers"
on storage.objects for insert
with check (
  bucket_id = 'audiobook-covers' 
  and auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploaded covers
create policy "Authenticated users can delete audiobook covers"
on storage.objects for delete
using (
  bucket_id = 'audiobook-covers' 
  and auth.role() = 'authenticated'
);

-- Allow public read access to avatars
create policy "Public Access to Avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
);

-- Allow users to update their own avatars
create policy "Users can update own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
create policy "Users can delete own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
