-- Add full_name and age to profiles table
alter table profiles 
add column if not exists full_name text,
add column if not exists age integer;
