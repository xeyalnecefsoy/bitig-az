-- ============================================
-- Add all potentially missing columns to posts table
-- Run this in Supabase SQL Editor if you get "Could not find the column" errors
-- ============================================

-- Thread/reply support
alter table public.posts add column if not exists parent_post_id uuid references public.posts(id) on delete set null;
create index if not exists posts_parent_post_id_idx on public.posts(parent_post_id);

-- Quote post support
alter table public.posts add column if not exists quoted_post_id uuid references public.posts(id) on delete set null;
create index if not exists posts_quoted_post_id_idx on public.posts(quoted_post_id);

-- Multiple images support
alter table public.posts add column if not exists image_urls text[];

-- Group support
alter table public.posts add column if not exists group_id uuid references public.groups(id) on delete cascade;

-- Moderation status
alter table public.posts add column if not exists status text default 'approved' check (status in ('pending', 'approved', 'flagged', 'rejected'));
alter table public.posts add column if not exists rejected_at timestamp with time zone;

-- Updated_at
alter table public.posts add column if not exists updated_at timestamp with time zone;

-- Link preview support
alter table public.posts add column if not exists link_preview_url text;
alter table public.posts add column if not exists link_preview_title text;
alter table public.posts add column if not exists link_preview_description text;
alter table public.posts add column if not exists link_preview_image_url text;
alter table public.posts add column if not exists link_preview_site_name text;
alter table public.posts add column if not exists link_preview_type text;
create index if not exists idx_posts_link_preview_url on public.posts(link_preview_url) where link_preview_url is not null;

-- Post update policy (needed for editing posts)
drop policy if exists "Users can update own posts" on public.posts;
create policy "Users can update own posts" on public.posts for update using (auth.uid() = user_id);

-- Refresh PostgREST schema cache (Supabase auto-refreshes, but this forces it)
-- After running this, go to Supabase Dashboard > Settings > API > click "Reload schema cache"
-- or simply wait ~60 seconds for the cache to refresh automatically