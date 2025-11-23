-- ============================================
-- Database Indexes for Performance
-- Optimized for actual schema
-- ============================================

-- Posts table indexes (Social feed performance)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);

-- Likes table indexes (Engagement queries)
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_composite ON likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

-- Books table indexes (Browse & search)
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_books_rating ON books(rating DESC);
CREATE INDEX IF NOT EXISTS idx_books_price ON books(price);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);

-- Profiles table indexes (User lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Full-text search indexes (Fast search)
CREATE INDEX IF NOT EXISTS idx_books_title_search 
  ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_author_search 
  ON books USING gin(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
  ON posts USING gin(to_tsvector('english', content));

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_books_genre_rating ON books(genre, rating DESC);

-- Analyze tables to update statistics
ANALYZE posts;
ANALYZE comments;
ANALYZE likes;
ANALYZE books;
ANALYZE profiles;
