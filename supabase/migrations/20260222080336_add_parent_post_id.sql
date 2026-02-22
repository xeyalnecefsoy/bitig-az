-- Add parent_post_id column to posts table to support threaded conversations
alter table posts add column parent_post_id uuid references posts(id) on delete cascade;

-- Create index for faster lookups of child posts in a thread
create index posts_parent_post_id_idx on posts(parent_post_id);
