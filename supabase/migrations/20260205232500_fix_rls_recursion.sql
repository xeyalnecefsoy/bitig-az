-- Fix infinite recursion in RLS policies
-- The issue: conversation_participants policy queries itself, causing infinite loop

-- Drop ALL existing policies first
drop policy if exists "Users can view their conversations" on public.conversations;
drop policy if exists "Users can view participants of their conversations" on public.conversation_participants;
drop policy if exists "Users can view their participations" on public.conversation_participants;
drop policy if exists "Users can view messages in their conversations" on public.direct_messages;
drop policy if exists "Users can view messages" on public.direct_messages;
drop policy if exists "Users can send messages in their conversations" on public.direct_messages;
drop policy if exists "Users can send messages" on public.direct_messages;
drop policy if exists "Users can update their conversations" on public.conversations;

-- Simple approach: Use direct user check for participants, then reference participants for others

-- 1. conversation_participants: Users can see rows where THEY are the participant (no recursion)
create policy "Users can view their participations"
on public.conversation_participants for select
using (user_id = auth.uid());

-- 2. conversations: Users can view if they have a participation record
--    Since we check participants first, no recursion here
create policy "Users can view their conversations"
on public.conversations for select
using (
    exists (
        select 1 from public.conversation_participants
        where conversation_id = conversations.id
        and user_id = auth.uid()
    )
);

-- 3. conversations: Users can update conversations they're in
create policy "Users can update their conversations"
on public.conversations for update
using (
    exists (
        select 1 from public.conversation_participants
        where conversation_id = conversations.id
        and user_id = auth.uid()
    )
);

-- 4. direct_messages: Users can view messages from conversations they're in
create policy "Users can view messages"
on public.direct_messages for select
using (
    exists (
        select 1 from public.conversation_participants
        where conversation_id = direct_messages.conversation_id
        and user_id = auth.uid()
    )
);

-- 5. direct_messages: Users can insert messages in their conversations
create policy "Users can send messages"
on public.direct_messages for insert
with check (
    sender_id = auth.uid()
    and exists (
        select 1 from public.conversation_participants
        where conversation_id = direct_messages.conversation_id
        and user_id = auth.uid()
    )
);
