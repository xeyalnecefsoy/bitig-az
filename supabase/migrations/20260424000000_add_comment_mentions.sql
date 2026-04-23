-- Add mention support to comments
alter table public.comments
  add column if not exists mentioned_user_ids uuid[] default array[]::uuid[];

-- Update notification trigger to handle mentions in comments
create or replace function public.handle_new_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user_id uuid;
  v_actor_id uuid;
  v_type text;
  v_entity_id uuid;
  v_mentioned_user_id uuid;
begin
  if (tg_table_name = 'likes') then
    v_type := 'like';
    v_actor_id := new.user_id;
    v_entity_id := new.post_id;
    select user_id into v_target_user_id from public.posts where id = new.post_id;

  elsif (tg_table_name = 'comments') then
    v_type := 'comment';
    v_actor_id := new.user_id;
    v_entity_id := new.post_id;
    if new.parent_comment_id is not null then
      select user_id into v_target_user_id from public.comments where id = new.parent_comment_id;
    else
      select user_id into v_target_user_id from public.posts where id = new.post_id;
    end if;

    -- Also notify any mentioned users
    if new.mentioned_user_ids is not null and array_length(new.mentioned_user_ids, 1) > 0 then
      foreach v_mentioned_user_id in array new.mentioned_user_ids loop
        if v_mentioned_user_id != v_actor_id and v_mentioned_user_id != v_target_user_id then
          insert into public.notifications (user_id, actor_id, type, entity_id)
          values (v_mentioned_user_id, v_actor_id, 'mention', v_entity_id);
        end if;
      end loop;
    end if;

  elsif (tg_table_name = 'follows') then
    v_type := 'follow';
    v_actor_id := new.follower_id;
    v_entity_id := null;
    v_target_user_id := new.following_id;
  end if;

  if v_target_user_id is not null and v_target_user_id != v_actor_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_target_user_id, v_actor_id, v_type, v_entity_id);
  end if;

  return new;
end;
$$;

-- Update notifications type check to include 'mention'
-- Note: This requires the existing check constraint to be relaxed or recreated.
-- If the check constraint was already created with a fixed list, we need to alter it.
-- For safety, we only add if the constraint doesn't already include 'mention'.
do $$
begin
  -- Check if 'mention' is already allowed in the type column
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_type_check'
      and conrelid = 'public.notifications'::regclass
      and pg_get_constraintdef(oid) like '%mention%'
  ) then
    alter table public.notifications
      drop constraint if exists notifications_type_check;
    alter table public.notifications
      add constraint notifications_type_check
      check (type in ('like', 'comment', 'follow', 'system', 'mention', 'dm', 'mod_rejected', 'mod_deleted'));
  end if;
end $$;
