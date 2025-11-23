-- Create notifications table
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'comment', 'follow', 'system')),
  entity_id uuid, -- ID of the post or other entity
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reports table
create table reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  target_id text not null, -- ID of the reported entity (post or user)
  target_type text not null check (target_type in ('post', 'user')),
  reason text not null,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Notifications
alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on notifications for insert
  with check (true); -- Ideally restricted, but for triggers/functions it works

create policy "Users can update their own notifications (mark as read)"
  on notifications for update
  using (auth.uid() = user_id);

-- RLS for Reports
alter table reports enable row level security;

create policy "Users can create reports"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "Admins can view reports"
  on reports for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'coadmin')
    )
  );

create policy "Admins can update reports"
  on reports for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'coadmin')
    )
  );

-- Function to create notification on like
create or replace function notify_on_like()
returns trigger as $$
begin
  if new.user_id != (select user_id from posts where id = new.post_id) then
    insert into notifications (user_id, actor_id, type, entity_id)
    values (
      (select user_id from posts where id = new.post_id),
      new.user_id,
      'like',
      new.post_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for like
create trigger on_like_created
  after insert on likes
  for each row execute procedure notify_on_like();

-- Function to create notification on comment
create or replace function notify_on_comment()
returns trigger as $$
begin
  if new.user_id != (select user_id from posts where id = new.post_id) then
    insert into notifications (user_id, actor_id, type, entity_id)
    values (
      (select user_id from posts where id = new.post_id),
      new.user_id,
      'comment',
      new.post_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for comment
create trigger on_comment_created
  after insert on comments
  for each row execute procedure notify_on_comment();
