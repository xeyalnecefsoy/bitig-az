-- Update RLS for posts to only show approved/pending posts to general users,
-- and restrict flagged/rejected to admins (or the owner).
-- Since we added the column, we need to modify the select policy.

-- Drop the old simple policy
drop policy if exists "Posts are viewable by everyone" on public.posts;

-- Recreate policy:
-- 1. Everyone can see approved posts.
-- 2. By default, pending posts might also be viewable until AI flags them (AI is very fast).
-- 3. Flagged/Rejected posts are hidden from public, except for the author and admins.

create policy "Approved and pending posts are viewable by everyone" on public.posts
  for select
  using (
    status in ('approved', 'pending') 
    or user_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin', 'superadmin'))
  );

-- Do the same for comments
drop policy if exists "Comments are viewable by everyone" on public.comments;

create policy "Approved and pending comments are viewable by everyone" on public.comments
  for select
  using (
    status in ('approved', 'pending') 
    or user_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin', 'superadmin'))
  );

-- Provide a function to easily approve/reject content (for the Admin Panel)
create or replace function public.moderate_content(
  p_entity_id uuid,
  p_entity_type text,
  p_new_status text
)
returns void as $$
begin
  -- Ensure caller is admin
  if not exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin', 'superadmin')) then
    raise exception 'Unauthorized';
  end if;

  if p_new_status not in ('approved', 'rejected') then
    raise exception 'Invalid status. Must be approved or rejected.';
  end if;

  if p_entity_type = 'post' then
    update public.posts set status = p_new_status where id = p_entity_id;
  elsif p_entity_type = 'comment' then
    update public.comments set status = p_new_status where id = p_entity_id;
  else
    raise exception 'Invalid entity type';
  end if;

  -- Add manual log
  insert into public.ai_moderation_logs (entity_id, entity_type, action, reason)
  values (p_entity_id, p_entity_type, p_new_status, 'Manual moderation by Admin');
  
end;
$$ language plpgsql security definer;
