-- Fix infinite recursion by using a security definer function
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- Drop the recursive policy
drop policy if exists "Admins can do everything on profiles." on profiles;

-- Re-create it using the function
create policy "Admins can do everything on profiles." on profiles
  for all
  using (is_admin());

-- Update other policies to use the function for consistency
drop policy if exists "Admins can do everything on books." on books;
create policy "Admins can do everything on books." on books for all using (is_admin());

drop policy if exists "Admins can do everything on posts." on posts;
create policy "Admins can do everything on posts." on posts for all using (is_admin());

drop policy if exists "Admins can do everything on comments." on comments;
create policy "Admins can do everything on comments." on comments for all using (is_admin());

drop policy if exists "Admins can do everything on likes." on likes;
create policy "Admins can do everything on likes." on likes for all using (is_admin());
