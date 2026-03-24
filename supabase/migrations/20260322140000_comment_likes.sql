-- Likes on comments (same post/thread as parent_comment_id migration)
create table if not exists public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (comment_id, user_id)
);

create index if not exists idx_comment_likes_comment_id on public.comment_likes (comment_id);
create index if not exists idx_comment_likes_user_id on public.comment_likes (user_id);

alter table public.comment_likes enable row level security;

drop policy if exists "Comment likes are viewable by everyone" on public.comment_likes;
drop policy if exists "Authenticated users can insert own comment likes" on public.comment_likes;
drop policy if exists "Users can delete own comment likes" on public.comment_likes;

create policy "Comment likes are viewable by everyone"
  on public.comment_likes for select
  using (true);

create policy "Authenticated users can insert own comment likes"
  on public.comment_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comment likes"
  on public.comment_likes for delete
  using (auth.uid() = user_id);
