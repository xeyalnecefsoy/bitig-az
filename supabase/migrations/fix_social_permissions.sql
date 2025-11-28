-- Ensure profiles are viewable by everyone
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Ensure follows are viewable by everyone
alter table follows enable row level security;

create policy "Follows are viewable by everyone"
  on follows for select
  using (true);

-- Ensure authenticated users can insert follows
create policy "Users can follow others"
  on follows for insert
  with check (auth.uid() = follower_id);

-- Ensure users can delete their own follows
create policy "Users can unfollow"
  on follows for delete
  using (auth.uid() = follower_id);
