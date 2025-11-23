-- Add role column to profiles if it doesn't exist
alter table profiles add column if not exists role text default 'user';

-- Update policies to allow admins to do everything
create policy "Admins can do everything on profiles." on profiles for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can do everything on books." on books for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can do everything on posts." on posts for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can do everything on comments." on comments for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can do everything on likes." on likes for all using (auth.uid() in (select id from profiles where role = 'admin'));
