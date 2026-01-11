-- ============================================
-- BITIG MASTER MIGRATION (ALL IN ONE)
-- 
-- This script sets up the ENTIRE database structure from scratch.
-- Run this in the SQL Editor of the NEW project.
-- ============================================

-- 1. Create Profiles Table (Core)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  role text default 'user' check (role in ('user', 'admin', 'coadmin')),
  rank text default 'novice',
  books_read integer default 0,
  reviews_count integer default 0,
  review_likes_received integer default 0,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Create Books Table
create table if not exists public.books (
  id text primary key, -- slug-like id (e.g. 'dune')
  title text not null,
  author text not null,
  narrator text,
  description text,
  cover text, -- or cover_url
  cover_url text, -- keeping both for compatibility
  price numeric(10, 2) default 0,
  rating numeric(3, 1) default 0,
  length text,
  genre text,
  language text default 'az',
  published_year integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.books enable row level security;
create policy "Books are viewable by everyone" on books for select using (true);
create policy "Admins can insert books" on books for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin'))
);
create policy "Admins can update books" on books for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin'))
);
create policy "Admins can delete books" on books for delete using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin'))
);


-- 3. Create Files Storage (Book Tracks)
create table if not exists public.book_tracks (
  id uuid default gen_random_uuid() primary key,
  book_id text references books(id) on delete cascade not null,
  title text not null,
  duration integer default 0, -- in seconds
  audio_url text, -- Legacy URL
  r2_key text, -- New R2 storage key
  format text default 'mp3',
  file_size bigint,
  position integer default 0, -- Used for ordering chapters
  is_preview boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.book_tracks enable row level security;
create policy "Tracks are viewable by everyone" on book_tracks for select using (true);
create policy "Admins can insert tracks" on book_tracks for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin'))
);
create policy "Admins can update tracks" on book_tracks for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin'))
);
create policy "Admins can delete tracks" on book_tracks for delete using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin'))
);

-- 4. Social: Posts
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  mentioned_book_id text references books(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;
create policy "Posts are viewable by everyone" on posts for select using (true);
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

-- 5. Social: Likes
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

alter table public.likes enable row level security;
create policy "Likes are viewable by everyone" on likes for select using (true);
create policy "Users can insert likes" on likes for insert with check (auth.uid() = user_id);
create policy "Users can delete likes" on likes for delete using (auth.uid() = user_id);

-- 6. Social: Comments
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Users can insert comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users can delete comments" on comments for delete using (auth.uid() = user_id);

-- 7. Social: Follows
create table if not exists public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

alter table public.follows enable row level security;
create policy "Follows viewable by everyone" on follows for select using (true);
create policy "Users can follow" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on follows for delete using (auth.uid() = follower_id);

-- 8. Reputation System Tables
create table if not exists public.user_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id text references books(id) on delete cascade not null,
  status text default 'reading' check (status in ('reading', 'completed', 'want_to_read')),
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, book_id)
);
alter table user_books enable row level security;
create policy "Public user books" on user_books for select using (true);
create policy "Users manage own books" on user_books for all using (auth.uid() = user_id);

create table if not exists public.book_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  book_id text references books(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  content text check (char_length(content) >= 10),
  likes_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, book_id)
);
alter table book_reviews enable row level security;
create policy "Public reviews" on book_reviews for select using (true);
create policy "Users manage own reviews" on book_reviews for all using (auth.uid() = user_id);

create table if not exists public.review_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  review_id uuid references book_reviews(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, review_id)
);
alter table review_likes enable row level security;
create policy "Public review likes" on review_likes for select using (true);
create policy "Users manage own review likes" on review_likes for all using (auth.uid() = user_id);

-- 9. Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'comment', 'follow', 'system')),
  entity_id uuid,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table notifications enable row level security;
create policy "Users view own notifications" on notifications for select using (auth.uid() = user_id);

-- 10. Reports
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references profiles(id) on delete cascade not null,
  target_id text not null, 
  target_type text not null,
  reason text not null,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table reports enable row level security;
create policy "Users create reports" on reports for insert with check (auth.uid() = reporter_id);

-- 11. Sponsors Table
create table if not exists public.sponsors (
  id uuid default gen_random_uuid() primary key,
  name text,
  company text,
  link_url text,
  banner_url text,
  placement text,
  position integer,
  impressions integer default 0,
  clicks integer default 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sponsors enable row level security;
create policy "Sponsors are viewable by everyone" on sponsors for select using (true);
create policy "Admins can manage sponsors" on sponsors for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin'))
);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Handle New User (Auto Profile Creation)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Calculate Rank Function
create or replace function calculate_user_rank(
  p_books_read integer,
  p_reviews_count integer,
  p_review_likes integer
) returns text as $$
begin
  return case 
    when p_books_read >= 100 and p_reviews_count >= 50 and p_review_likes >= 250 then 'writer'
    when p_books_read >= 50 and p_reviews_count >= 30 and p_review_likes >= 100 then 'ozan'
    when p_books_read >= 25 and p_reviews_count >= 15 and p_review_likes >= 50 then 'scholar'
    when p_books_read >= 10 and p_reviews_count >= 5 then 'bookworm'
    when p_books_read >= 3 then 'reader'
    else 'novice'
  end;
end;
$$ language plpgsql;

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;

create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
create policy "Anyone can update an avatar." on storage.objects for update with check ( bucket_id = 'avatars' );

create policy "Cover images are publicly accessible." on storage.objects for select using ( bucket_id = 'covers' );
create policy "Admins can upload covers." on storage.objects for insert with check ( bucket_id = 'covers' AND exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coadmin')) );

-- SEED DATA (Base Books)
insert into books (id, title, author, price, rating, length, cover_url, description, genre) values
('dunesaga', 'Dune: The Saga Begins', 'Frank Herbert', 14.99, 4.8, '21h 2m', '/dune.jpg', 'A sweeping epic of politics, religion, and ecology on the desert planet Arrakis.', 'Sci-Fi'),
('atomic', 'Atomic Habits', 'James Clear', 11.99, 4.7, '5h 35m', '/atomic_habits.jpg', 'Build better habits and systems for continuous improvement with practical strategies.', 'Nonfiction'),
('hobbit', 'The Hobbit', 'J.R.R. Tolkien', 12.49, 4.9, '10h 24m', '/the_hobbit.jpg', 'Bilbo Baggins embarks on an unexpected journey filled with dragons and dwarves.', 'Fantasy'),
('martian', 'The Martian', 'Andy Weir', 13.99, 4.6, '10h 53m', '/martian.jpg', 'A stranded astronaut fights to survive on Mars using ingenuity and humor.', 'Sci-Fi'),
('becoming', 'Becoming', 'Michelle Obama', 10.99, 4.8, '19h 3m', '/becoming.jpg', 'An intimate, powerful memoir by the former First Lady of the United States.', 'Memoir'),
('sapiens', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 15.49, 4.7, '15h 17m', '/sapiens.jpg', 'A profound exploration of humanity’s past and our impact on the world.', 'History')
on conflict (id) do nothing;
