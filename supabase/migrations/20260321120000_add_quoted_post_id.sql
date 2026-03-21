-- Quote posts (X-style): new post embeds another post via quoted_post_id.
-- Distinct from parent_post_id (reply / thread chain).
alter table public.posts
  add column if not exists quoted_post_id uuid references public.posts(id) on delete set null;

create index if not exists posts_quoted_post_id_idx on public.posts(quoted_post_id);

comment on column public.posts.quoted_post_id is 'Referenced post shown as embedded quote (not a reply thread).';
