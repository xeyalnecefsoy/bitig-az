-- ============================================
-- REPUTATION SYSTEM MIGRATION
-- Oxunmuş kitablar, rəylər və rütbə sistemi
-- ============================================

-- 1. Oxunmuş kitabları izləmək üçün cədvəl
CREATE TABLE IF NOT EXISTS user_books (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id text NOT NULL,
  status text DEFAULT 'reading' CHECK (status IN ('reading', 'completed', 'want_to_read')),
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 2. Kitab rəyləri cədvəli  
CREATE TABLE IF NOT EXISTS book_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL CHECK (char_length(content) >= 50), -- Minimum 50 simvol
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 3. Rəy bəyənmələri
CREATE TABLE IF NOT EXISTS review_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  review_id uuid REFERENCES book_reviews(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, review_id)
);

-- 4. Profiles cədvəlinə reputasiya sütunları əlavə et
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rank text DEFAULT 'novice',
ADD COLUMN IF NOT EXISTS books_read integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_likes_received integer DEFAULT 0;

-- 5. RLS siyasətləri
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- user_books policies
CREATE POLICY "Users can view all user_books" ON user_books FOR SELECT USING (true);
CREATE POLICY "Users can insert own user_books" ON user_books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_books" ON user_books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_books" ON user_books FOR DELETE USING (auth.uid() = user_id);

-- book_reviews policies
CREATE POLICY "Anyone can view reviews" ON book_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON book_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON book_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON book_reviews FOR DELETE USING (auth.uid() = user_id);

-- review_likes policies
CREATE POLICY "Anyone can view review_likes" ON review_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own review_likes" ON review_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own review_likes" ON review_likes FOR DELETE USING (auth.uid() = user_id);

-- 6. Rütbəni hesablayan funksiya
CREATE OR REPLACE FUNCTION calculate_user_rank(
  p_books_read integer,
  p_reviews_count integer,
  p_review_likes integer
) RETURNS text AS $$
BEGIN
  RETURN CASE 
    WHEN p_books_read >= 100 AND p_reviews_count >= 50 AND p_review_likes >= 250 THEN 'writer'
    WHEN p_books_read >= 50 AND p_reviews_count >= 30 AND p_review_likes >= 100 THEN 'ozan'
    WHEN p_books_read >= 25 AND p_reviews_count >= 15 AND p_review_likes >= 50 THEN 'scholar'
    WHEN p_books_read >= 10 AND p_reviews_count >= 5 THEN 'bookworm'
    WHEN p_books_read >= 3 THEN 'reader'
    ELSE 'novice'
  END;
END;
$$ LANGUAGE plpgsql;

-- 7. Kitab tamamlandıqda statistikaları yeniləyən trigger
CREATE OR REPLACE FUNCTION update_books_read_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE profiles 
    SET 
      books_read = (SELECT COUNT(*) FROM user_books WHERE user_id = NEW.user_id AND status = 'completed'),
      rank = calculate_user_rank(
        (SELECT COUNT(*) FROM user_books WHERE user_id = NEW.user_id AND status = 'completed'),
        (SELECT COUNT(*) FROM book_reviews WHERE user_id = NEW.user_id),
        COALESCE((SELECT review_likes_received FROM profiles WHERE id = NEW.user_id), 0)
      )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_book_status_change ON user_books;
CREATE TRIGGER on_book_status_change
  AFTER INSERT OR UPDATE ON user_books
  FOR EACH ROW EXECUTE FUNCTION update_books_read_count();

-- 8. Rəy əlavə edildikdə statistikaları yeniləyən trigger
CREATE OR REPLACE FUNCTION update_reviews_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    reviews_count = (SELECT COUNT(*) FROM book_reviews WHERE user_id = NEW.user_id),
    rank = calculate_user_rank(
      COALESCE((SELECT books_read FROM profiles WHERE id = NEW.user_id), 0),
      (SELECT COUNT(*) FROM book_reviews WHERE user_id = NEW.user_id),
      COALESCE((SELECT review_likes_received FROM profiles WHERE id = NEW.user_id), 0)
    )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON book_reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON book_reviews
  FOR EACH ROW EXECUTE FUNCTION update_reviews_count();

-- 9. Rəy bəyənildikdə statistikaları yeniləyən trigger
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  v_review_owner_id uuid;
BEGIN
  -- Rəyin sahibini tap
  SELECT user_id INTO v_review_owner_id FROM book_reviews WHERE id = NEW.review_id;
  
  -- Rəyin likes_count-unu yenilə
  UPDATE book_reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
  
  -- Rəy sahibinin ümumi bəyənmə sayını və rütbəsini yenilə
  UPDATE profiles 
  SET 
    review_likes_received = (
      SELECT COALESCE(SUM(likes_count), 0) 
      FROM book_reviews 
      WHERE user_id = v_review_owner_id
    ),
    rank = calculate_user_rank(
      COALESCE((SELECT books_read FROM profiles WHERE id = v_review_owner_id), 0),
      COALESCE((SELECT reviews_count FROM profiles WHERE id = v_review_owner_id), 0),
      (SELECT COALESCE(SUM(likes_count), 0) FROM book_reviews WHERE user_id = v_review_owner_id)
    )
  WHERE id = v_review_owner_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_liked ON review_likes;
CREATE TRIGGER on_review_liked
  AFTER INSERT ON review_likes
  FOR EACH ROW EXECUTE FUNCTION update_review_likes_count();

-- 10. Rəy bəyənməsi silindikdə trigger
CREATE OR REPLACE FUNCTION on_review_unlike()
RETURNS TRIGGER AS $$
DECLARE
  v_review_owner_id uuid;
BEGIN
  SELECT user_id INTO v_review_owner_id FROM book_reviews WHERE id = OLD.review_id;
  
  UPDATE book_reviews SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.review_id;
  
  UPDATE profiles 
  SET 
    review_likes_received = (
      SELECT COALESCE(SUM(likes_count), 0) 
      FROM book_reviews 
      WHERE user_id = v_review_owner_id
    ),
    rank = calculate_user_rank(
      COALESCE((SELECT books_read FROM profiles WHERE id = v_review_owner_id), 0),
      COALESCE((SELECT reviews_count FROM profiles WHERE id = v_review_owner_id), 0),
      (SELECT COALESCE(SUM(likes_count), 0) FROM book_reviews WHERE user_id = v_review_owner_id)
    )
  WHERE id = v_review_owner_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_unliked ON review_likes;
CREATE TRIGGER on_review_unliked
  AFTER DELETE ON review_likes
  FOR EACH ROW EXECUTE FUNCTION on_review_unlike();
