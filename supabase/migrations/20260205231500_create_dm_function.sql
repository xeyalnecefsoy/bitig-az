-- Function to start a conversation safely
create or replace function public.start_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
  existing_conc_id uuid;
  new_conv_id uuid;
begin
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if current_user_id = other_user_id then
    raise exception 'Cannot start conversation with yourself';
  end if;

  -- 1. Check if a direct conversation already exists
  -- We're looking for a conversation that has exactly these two participants and no one else (for DM)
  -- Or just valid pair if we don't care about "groups" yet.
  -- Simplified check: Find a conversation where both are participants.
  select c.id into existing_conc_id
  from conversations c
  join conversation_participants p1 on c.id = p1.conversation_id
  join conversation_participants p2 on c.id = p2.conversation_id
  where p1.user_id = current_user_id
  and p2.user_id = other_user_id
  limit 1;

  if existing_conc_id is not null then
    return existing_conc_id;
  end if;

  -- 2. Create new conversation
  insert into conversations (is_group, last_message)
  values (false, 'Started a conversation')
  returning id into new_conv_id;

  -- 3. Add participants
  insert into conversation_participants (conversation_id, user_id)
  values 
    (new_conv_id, current_user_id),
    (new_conv_id, other_user_id);

  return new_conv_id;
end;
$$;
