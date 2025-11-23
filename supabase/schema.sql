-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  bio text,
  role text default 'user',
  updated_at timestamp with time zone
);

-- Create books table
create table books (
  id text primary key,
  title text not null,
  author text not null,
  price numeric not null,
  rating numeric,
  length text,
  cover text,
  description text,
  genre text
);

-- Create posts table
create table posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comments table
create table comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create likes table
create table likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table books enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

-- Policies
-- Public read access
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Books are viewable by everyone." on books for select using (true);
create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Comments are viewable by everyone." on comments for select using (true);
create policy "Likes are viewable by everyone." on likes for select using (true);

-- Authenticated insert/update/delete
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

create policy "Authenticated users can create posts." on posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts." on posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts." on posts for delete using (auth.uid() = user_id);

create policy "Authenticated users can create comments." on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments." on comments for delete using (auth.uid() = user_id);

create policy "Authenticated users can like posts." on likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts." on likes for delete using (auth.uid() = user_id);
