-- Drop existing policies to avoid conflicts
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Follows are viewable by everyone" on follows;
drop policy if exists "Users can follow others" on follows;
drop policy if exists "Users can unfollow" on follows;

-- Enable RLS (idempotent)
alter table profiles enable row level security;
alter table follows enable row level security;

-- Re-create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Follows are viewable by everyone"
  on follows for select
  using (true);

create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);
