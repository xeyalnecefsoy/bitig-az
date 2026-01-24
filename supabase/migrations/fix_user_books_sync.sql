-- Refine the books_read_count trigger to be more robust
-- Handles INSERT, UPDATE, and DELETE and always keeps profiles.books_read accurate

CREATE OR REPLACE FUNCTION update_books_read_count()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user_id from NEW (for INSERT/UPDATE) or OLD (for DELETE)
  IF (TG_OP = 'DELETE') THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Update count and rank for the user
  UPDATE profiles 
  SET 
    books_read = (SELECT COUNT(*) FROM user_books WHERE user_id = v_user_id AND status = 'completed'),
    rank = calculate_user_rank(
      (SELECT COUNT(*) FROM user_books WHERE user_id = v_user_id AND status = 'completed'),
      COALESCE(reviews_count, 0),
      COALESCE(review_likes_received, 0)
    )
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger for all operations
DROP TRIGGER IF EXISTS on_book_status_change ON user_books;
CREATE TRIGGER on_book_status_change
  AFTER INSERT OR UPDATE OR DELETE ON user_books
  FOR EACH ROW EXECUTE FUNCTION update_books_read_count();
