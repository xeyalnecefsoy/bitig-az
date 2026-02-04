-- Fix type mismatch for calculate_user_rank function
-- COUNT(*) returns bigint, but function expects integer

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
    books_read = (SELECT COUNT(*)::integer FROM user_books WHERE user_id = v_user_id AND status = 'completed'),
    rank = calculate_user_rank(
      (SELECT COUNT(*)::integer FROM user_books WHERE user_id = v_user_id AND status = 'completed'),
      COALESCE(reviews_count, 0),
      COALESCE(review_likes_received, 0)
    )
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
