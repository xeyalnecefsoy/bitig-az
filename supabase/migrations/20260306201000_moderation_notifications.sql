-- 1. Update notifications type constraint to allow moderation types
alter table public.notifications drop constraint if exists "notifications_type_check";
alter table public.notifications add constraint "notifications_type_check" 
  check (type in ('like', 'comment', 'follow', 'system', 'mod_rejected', 'mod_deleted'));

-- 2. Update the moderate_content function to send moderation notification types
create or replace function public.moderate_content(
  p_entity_id uuid,
  p_entity_type text,
  p_new_status text
)
returns void as $$
declare
  v_owner_id uuid;
begin
  -- Ensure caller is admin
  if not exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin', 'superadmin')) then
    raise exception 'Unauthorized';
  end if;

  if p_new_status not in ('approved', 'rejected', 'deleted') then
    raise exception 'Invalid status. Must be approved, rejected, or deleted.';
  end if;

  -- Verify existence and get the owner of the content
  if p_entity_type = 'post' then
    select user_id into v_owner_id from public.posts where id = p_entity_id;
    if not found then raise exception 'Post not found'; end if;
    
    if p_new_status = 'deleted' then
      delete from public.posts where id = p_entity_id;
    else
      update public.posts set status = p_new_status where id = p_entity_id;
    end if;

  elsif p_entity_type = 'comment' then
    select user_id into v_owner_id from public.comments where id = p_entity_id;
    if not found then raise exception 'Comment not found'; end if;
    
    if p_new_status = 'deleted' then
      delete from public.comments where id = p_entity_id;
    else
      update public.comments set status = p_new_status where id = p_entity_id;
    end if;
  else
    raise exception 'Invalid entity type';
  end if;

  -- Add manual log for audit trailing
  insert into public.ai_moderation_logs (entity_id, entity_type, action, reason)
  values (p_entity_id, p_entity_type, p_new_status, 'Manual moderation by Admin');

  -- Send a specific SYSTEM notification to the owner if the content was rejected or deleted
  if p_new_status = 'rejected' then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_owner_id, auth.uid(), 'mod_rejected', p_entity_id);
  elsif p_new_status = 'deleted' then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    -- entity_id might refer to a deleted post now, but keeping it logged is fine
    values (v_owner_id, auth.uid(), 'mod_deleted', p_entity_id);
  end if;

end;
$$ language plpgsql security definer;
