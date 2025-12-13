-- Add mentioned_book_id to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS mentioned_book_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posts_mentioned_book_id ON posts (mentioned_book_id);

-- Update RLS policies (although existing insert/select should cover it, good to be safe)
-- Assuming 'posts' already has generic RLS enabled. If mentioned_book_id is just a column, no extra RLS needed beyond 'post' CRUD policies.
