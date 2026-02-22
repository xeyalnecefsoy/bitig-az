-- Add image_url to posts table
alter table posts add column image_url text;

-- Insert new storage bucket for post images
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true);

-- Allow public read access to post-images
create policy "Public Access to Post Images"
on storage.objects for select
using ( bucket_id = 'post-images' );

-- Allow authenticated users to upload post images
create policy "Authenticated users can upload post images"
on storage.objects for insert
with check (
  bucket_id = 'post-images' 
  and auth.role() = 'authenticated'
);

-- Allow users to update their own post images
create policy "Users can update own post images"
on storage.objects for update
using (
  bucket_id = 'post-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own post images
create policy "Users can delete own post images"
on storage.objects for delete
using (
  bucket_id = 'post-images' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
