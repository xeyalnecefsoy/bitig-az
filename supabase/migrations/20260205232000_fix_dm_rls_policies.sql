-- Fix RLS policies for DM tables

-- Drop existing potentially broken policies
drop policy if exists "Users can view their conversations" on public.conversations;
drop policy if exists "Users can view participants of their conversations" on public.conversation_participants;
drop policy if exists "Users can view messages in their conversations" on public.direct_messages;
drop policy if exists "Users can send messages in their conversations" on public.direct_messages;

-- Recreate with clearer logic

-- Conversations: Can view if you are a participant
create policy "Users can view their conversations"
on public.conversations for select
using (
    id in (
        select conversation_id from public.conversation_participants
        where user_id = auth.uid()
    )
);

-- Conversation Participants: Can view all participants of conversations you're in
create policy "Users can view participants of their conversations"
on public.conversation_participants for select
using (
    conversation_id in (
        select conversation_id from public.conversation_participants
        where user_id = auth.uid()
    )
);

-- Direct Messages: Can view messages in conversations you're in
create policy "Users can view messages in their conversations"
on public.direct_messages for select
using (
    conversation_id in (
        select conversation_id from public.conversation_participants
        where user_id = auth.uid()
    )
);

-- Direct Messages: Can send messages in conversations you're in
create policy "Users can send messages in their conversations"
on public.direct_messages for insert
with check (
    auth.uid() = sender_id
    and conversation_id in (
        select conversation_id from public.conversation_participants
        where user_id = auth.uid()
    )
);

-- Allow updating conversations you're in (for last_message updates)
create policy "Users can update their conversations"
on public.conversations for update
using (
    id in (
        select conversation_id from public.conversation_participants
        where user_id = auth.uid()
    )
);
