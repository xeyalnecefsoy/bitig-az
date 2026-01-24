-- Notifications Logic
-- Automatically creates notifications for Likes, Comments, and Follows

CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_target_user_id uuid;
  v_actor_id uuid;
  v_type text;
  v_entity_id uuid;
BEGIN
  -- 1. Handle LIKES
  IF (TG_TABLE_NAME = 'likes') THEN
    v_type := 'like';
    v_actor_id := NEW.user_id;
    v_entity_id := NEW.post_id;
    -- Get post owner
    SELECT user_id INTO v_target_user_id FROM public.posts WHERE id = NEW.post_id;

  -- 2. Handle COMMENTS
  ELSIF (TG_TABLE_NAME = 'comments') THEN
    v_type := 'comment';
    v_actor_id := NEW.user_id;
    v_entity_id := NEW.post_id;
    -- Get post owner
    SELECT user_id INTO v_target_user_id FROM public.posts WHERE id = NEW.post_id;

  -- 3. Handle FOLLOWS
  ELSIF (TG_TABLE_NAME = 'follows') THEN
    v_type := 'follow';
    v_actor_id := NEW.follower_id;
    v_entity_id := NULL; -- No entity for follow
    v_target_user_id := NEW.following_id;
  END IF;

  -- Insert notification if target exists and is not self
  IF v_target_user_id IS NOT NULL AND v_target_user_id != v_actor_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (v_target_user_id, v_actor_id, v_type, v_entity_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Triggers
DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();

DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification();
