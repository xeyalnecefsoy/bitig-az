-- 1. Update ai_moderation_logs to accept 'deleted' action
alter table public.ai_moderation_logs drop constraint if exists "ai_moderation_logs_action_check";
alter table public.ai_moderation_logs add constraint "ai_moderation_logs_action_check" 
  check (action in ('approved', 'flagged', 'rejected', 'deleted', 'error'));

-- 2. Enable Realtime for ai_moderation_logs so the Admin UI updates instantly
alter publication supabase_realtime add table public.ai_moderation_logs;

-- 3. Replace the moderate_content function with advanced logic
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

  -- Delete from ai_moderation_logs if 'deleted' is chosen so the queue is clean? 
  -- Actually, let's keep the log but update its status so there's an audit trail.
  -- Add manual log for audit trailing
  insert into public.ai_moderation_logs (entity_id, entity_type, action, reason)
  values (p_entity_id, p_entity_type, p_new_status, 'Manual moderation by Admin');

  -- Send a notification to the owner if the content was rejected or deleted
  if p_new_status in ('rejected', 'deleted') then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_owner_id, auth.uid(), 'system', p_entity_id);
  end if;

end;
$$ language plpgsql security definer;
