-- Add updated_at column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- Add updated_at column to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
