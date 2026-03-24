alter table public.posts
  add column if not exists link_preview_url text,
  add column if not exists link_preview_title text,
  add column if not exists link_preview_description text,
  add column if not exists link_preview_image_url text,
  add column if not exists link_preview_site_name text,
  add column if not exists link_preview_type text;

create index if not exists idx_posts_link_preview_url
  on public.posts(link_preview_url)
  where link_preview_url is not null;
