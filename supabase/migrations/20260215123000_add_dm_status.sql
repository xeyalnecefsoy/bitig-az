-- Add status column to conversation_participants
alter table public.conversation_participants 
add column if not exists status text default 'accepted' check (status in ('accepted', 'pending', 'ignored', 'blocked'));

-- Update the start_direct_conversation function to handle status based on follows
create or replace function public.start_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
  existing_conc_id uuid;
  new_conv_id uuid;
  recipient_follows_sender boolean;
  recipient_status text;
begin
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if current_user_id = other_user_id then
    raise exception 'Cannot start conversation with yourself';
  end if;

  -- 1. Check if a direct conversation already exists
  select c.id into existing_conc_id
  from conversations c
  join conversation_participants p1 on c.id = p1.conversation_id
  join conversation_participants p2 on c.id = p2.conversation_id
  where p1.user_id = current_user_id
  and p2.user_id = other_user_id
  and c.is_group = false
  limit 1;

  if existing_conc_id is not null then
    return existing_conc_id;
  end if;

  -- 2. Check if the recipient follows the sender
  -- If Recipient (other_user_id) follows Sender (current_user_id), then Accepted.
  -- Otherwise, Pending.
  select exists (
    select 1 from follows 
    where follower_id = other_user_id 
    and following_id = current_user_id
  ) into recipient_follows_sender;

  if recipient_follows_sender then
    recipient_status := 'accepted';
  else
    recipient_status := 'pending';
  end if;

  -- 3. Create new conversation
  insert into conversations (is_group, last_message)
  values (false, null)
  returning id into new_conv_id;

  -- 4. Add participants
  insert into conversation_participants (conversation_id, user_id, status)
  values 
    (new_conv_id, current_user_id, 'accepted'), -- Sender is always accepted
    (new_conv_id, other_user_id, recipient_status); -- Recipient depends on follow status

  return new_conv_id;
end;
$$;
