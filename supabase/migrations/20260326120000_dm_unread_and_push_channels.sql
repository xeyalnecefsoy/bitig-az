-- DM unread tracking + unified notification types + push channel persistence

-- 1) Conversation-level unread state
alter table public.conversation_participants
  add column if not exists unread_count integer not null default 0,
  add column if not exists last_read_at timestamp with time zone;

create index if not exists idx_conversation_participants_user_status
  on public.conversation_participants(user_id, status);

create index if not exists idx_conversation_participants_user_unread
  on public.conversation_participants(user_id, unread_count);

-- 2) Notifications: add DM type while preserving existing moderation types
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.notifications'::regclass
    AND contype = 'c'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type in ('like', 'comment', 'follow', 'system', 'dm', 'mod_rejected', 'mod_deleted'));

create index if not exists idx_notifications_user_read_created
  on public.notifications(user_id, read, created_at desc);

-- 3) Push channel persistence
create table if not exists public.mobile_push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text not null,
  platform text not null default 'expo' check (platform in ('expo')),
  active boolean not null default true,
  last_seen_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique (user_id, token)
);

alter table public.mobile_push_tokens enable row level security;

drop policy if exists "Users can manage own mobile tokens" on public.mobile_push_tokens;
create policy "Users can manage own mobile tokens"
  on public.mobile_push_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.web_push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  active boolean not null default true,
  last_seen_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique (user_id, endpoint)
);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists "Users can manage own web subscriptions" on public.web_push_subscriptions;
create policy "Users can manage own web subscriptions"
  on public.web_push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) Trigger helpers for DM unread + in-app notifications
create or replace function public.on_direct_message_insert()
returns trigger
language plpgsql
security definer
as $$
declare
  recipient_id uuid;
begin
  -- Update conversation preview metadata
  update public.conversations
  set updated_at = new.created_at,
      last_message = coalesce(new.content, last_message)
  where id = new.conversation_id;

  -- Find recipient (for 1:1 DMs)
  select cp.user_id into recipient_id
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id
    and cp.user_id <> new.sender_id
  limit 1;

  if recipient_id is not null then
    update public.conversation_participants
    set unread_count = coalesce(unread_count, 0) + 1
    where conversation_id = new.conversation_id
      and user_id = recipient_id;

    -- In-app notification row for recipient
    insert into public.notifications (user_id, actor_id, type, entity_id, read)
    values (recipient_id, new.sender_id, 'dm', new.conversation_id, false);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_on_direct_message_insert on public.direct_messages;
create trigger trg_on_direct_message_insert
after insert on public.direct_messages
for each row execute function public.on_direct_message_insert();

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.conversation_participants
  set unread_count = 0,
      last_read_at = now(),
      status = 'accepted'
  where conversation_id = p_conversation_id
    and user_id = current_user_id;

  update public.notifications
  set read = true
  where user_id = current_user_id
    and type = 'dm'
    and entity_id = p_conversation_id
    and read = false;
end;
$$;

