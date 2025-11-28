-- Create follows table
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  
  -- Prevent users from following themselves
  constraint no_self_follow check (follower_id != following_id),
  
  -- Prevent duplicate follows
  unique(follower_id, following_id)
);

-- Create indexes for performance
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_follows_created_at on follows(created_at desc);

-- Enable Row Level Security
alter table follows enable row level security;

-- RLS Policies

-- Anyone can view follows
create policy "Follows are viewable by everyone"
  on follows for select
  using (true);

-- Users can follow others
create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

-- Users can unfollow
create policy "Users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);
