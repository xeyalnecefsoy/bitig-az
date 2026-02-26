-- Add polls related tables for social posts
-- 1. Polls Table
create table if not exists public.polls (
  post_id uuid primary key references posts(id) on delete cascade not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Polls
alter table public.polls enable row level security;
create policy "Polls are viewable by everyone" on public.polls for select using (true);
create policy "Users can insert polls if they own the post" on public.polls for insert with check (
  exists (
    select 1 from public.posts 
    where id = post_id and user_id = auth.uid()
  )
);

-- 2. Poll Options
create table if not exists public.poll_options (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references polls(post_id) on delete cascade not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Poll Options
alter table public.poll_options enable row level security;
create policy "Poll options are viewable by everyone" on public.poll_options for select using (true);
create policy "Users can insert options if they own the post" on public.poll_options for insert with check (
  exists (
    select 1 from public.posts 
    where id = post_id and user_id = auth.uid()
  )
);

-- 3. Poll Votes
create table if not exists public.poll_votes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references polls(post_id) on delete cascade not null,
  option_id uuid references poll_options(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: A user can only vote once per poll (post_id)
  unique(post_id, user_id)
);

-- RLS for Poll Votes
alter table public.poll_votes enable row level security;
create policy "Poll votes are viewable by everyone" on public.poll_votes for select using (true);
create policy "Authenticated users can vote" on public.poll_votes for insert with check (
  auth.uid() = user_id
);
-- We won't allow modifying or deleting votes, making them permanent.
