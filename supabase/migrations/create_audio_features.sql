-- ============================================
-- BITIG: AUDIO FEATURES MIGRATION
-- Listening Progress & Bookmarks
-- ============================================

-- 1. Listening Progress Table
-- Tracks user's listening position for each book
create table if not exists public.listening_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id text references books(id) on delete cascade not null,
  track_id uuid references book_tracks(id) on delete set null,
  track_index integer default 0,
  position_seconds integer default 0,
  total_listened_seconds integer default 0,
  last_played_at timestamp with time zone default now(),
  completed boolean default false,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(user_id, book_id)
);

alter table listening_progress enable row level security;

create policy "Users can view own progress" 
  on listening_progress for select 
  using (auth.uid() = user_id);

create policy "Users can insert own progress" 
  on listening_progress for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own progress" 
  on listening_progress for update 
  using (auth.uid() = user_id);

create policy "Users can delete own progress" 
  on listening_progress for delete 
  using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists idx_listening_progress_user 
  on listening_progress(user_id);
create index if not exists idx_listening_progress_last_played 
  on listening_progress(user_id, last_played_at desc);

-- 2. Bookmarks Table
-- Users can bookmark specific moments in audiobooks
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id text references books(id) on delete cascade not null,
  track_id uuid references book_tracks(id) on delete cascade,
  track_index integer default 0,
  position_seconds integer not null,
  note text,
  created_at timestamp with time zone default now()
);

alter table bookmarks enable row level security;

create policy "Users can view own bookmarks" 
  on bookmarks for select 
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks" 
  on bookmarks for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks" 
  on bookmarks for delete 
  using (auth.uid() = user_id);

-- Index for faster queries
create index if not exists idx_bookmarks_user_book 
  on bookmarks(user_id, book_id);

-- 3. Update profiles table for streaks
alter table profiles add column if not exists current_streak integer default 0;
alter table profiles add column if not exists longest_streak integer default 0;
alter table profiles add column if not exists last_active_date date;
alter table profiles add column if not exists total_listening_seconds integer default 0;

-- 4. Function to update streak
create or replace function update_user_streak(p_user_id uuid)
returns void as $$
declare
  v_last_active date;
  v_current_streak integer;
  v_longest_streak integer;
begin
  select last_active_date, current_streak, longest_streak
  into v_last_active, v_current_streak, v_longest_streak
  from profiles where id = p_user_id;

  if v_last_active is null or v_last_active < current_date - interval '1 day' then
    -- Streak broken or first time
    v_current_streak := 1;
  elsif v_last_active = current_date - interval '1 day' then
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  end if;
  -- If same day, no change to streak

  if v_current_streak > coalesce(v_longest_streak, 0) then
    v_longest_streak := v_current_streak;
  end if;

  update profiles
  set current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_active_date = current_date
  where id = p_user_id;
end;
$$ language plpgsql security definer;
