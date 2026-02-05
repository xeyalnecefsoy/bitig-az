-- Create Conversations Table
create table if not exists public.conversations (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_message text,
    is_group boolean default false
);

alter table public.conversations enable row level security;

-- Create Conversation Participants Table
create table if not exists public.conversation_participants (
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (conversation_id, user_id)
);

alter table public.conversation_participants enable row level security;

-- Create Direct Messages Table
create table if not exists public.direct_messages (
    id uuid default gen_random_uuid() primary key,
    conversation_id uuid references public.conversations(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    content text,
    message_type text default 'text' check (message_type in ('text', 'book_share', 'post_share')),
    entity_id text, -- ID of the book or post being shared
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.direct_messages enable row level security;

-- RLS Policies

-- Conversations
-- Users can view conversations they are participating in
create policy "Users can view their conversations"
on public.conversations for select
using (
    exists (
        select 1 from public.conversation_participants
        where conversation_id = id
        and user_id = auth.uid()
    )
);

-- Participants
-- Users can view participants of conversations they are in
create policy "Users can view participants of their conversations"
on public.conversation_participants for select
using (
    exists (
        select 1 from public.conversation_participants p
        where p.conversation_id = conversation_id
        and p.user_id = auth.uid()
    )
);

-- Direct Messages
-- Users can view messages in conversations they are in
create policy "Users can view messages in their conversations"
on public.direct_messages for select
using (
    exists (
        select 1 from public.conversation_participants
        where conversation_id = direct_messages.conversation_id
        and user_id = auth.uid()
    )
);

-- Users can insert messages in conversations they are in
create policy "Users can send messages in their conversations"
on public.direct_messages for insert
with check (
    auth.uid() = sender_id
    and exists (
        select 1 from public.conversation_participants
        where conversation_id = direct_messages.conversation_id
        and user_id = auth.uid()
    )
);

-- Only Admins/Co-admins/System can create conversations/participants directly (usually done via server actions/functions to ensure consistency)
-- But for now, let's allow authenticated users to insert into 'conversations' and 'conversation_participants' 
-- if they are creating a new chat. Complex validation usually needed here.
-- For simplicity in this iteration, we will rely on Server Actions (Service Role) to create the conversation 
-- and participants to ensure correct pairing. So we won't add public insert policies for these tables yet, 
-- except maybe for messages which we did above.

-- Indexes for performance
create index if not exists idx_conversation_participants_user on public.conversation_participants(user_id);
create index if not exists idx_conversation_participants_conv on public.conversation_participants(conversation_id);
create index if not exists idx_direct_messages_conv on public.direct_messages(conversation_id);
create index if not exists idx_direct_messages_created_at on public.direct_messages(created_at);
