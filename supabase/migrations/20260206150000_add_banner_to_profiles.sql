-- Add banner_url to profiles table
alter table public.profiles 
add column if not exists banner_url text;

-- Allow public access to banner_url (RLS is already handled for the table usually, but ensuring select is open)
-- (Existing policies likely cover this as profiles is generally public read)
