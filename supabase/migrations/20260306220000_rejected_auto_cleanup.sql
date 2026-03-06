-- =============================================================================
-- 30 Günlük Avtomatik Təmizlik üçün Migration
-- rejected_at sütunu, ai_moderation_logs constraint yeniləmə, moderate_content RPC yeniləmə
-- =============================================================================

-- 1. posts və comments cədvəllərinə rejected_at timestamp sütunu əlavə et
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz DEFAULT NULL;

ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz DEFAULT NULL;

-- 2. ai_moderation_logs action constraint-ə 'auto_deleted' əlavə et
ALTER TABLE public.ai_moderation_logs DROP CONSTRAINT IF EXISTS "ai_moderation_logs_action_check";
ALTER TABLE public.ai_moderation_logs ADD CONSTRAINT "ai_moderation_logs_action_check" 
  CHECK (action IN ('approved', 'flagged', 'rejected', 'deleted', 'auto_deleted', 'error'));

-- 3. moderate_content RPC funksiyasını yenilə - reject zamanı rejected_at yazılsın
CREATE OR REPLACE FUNCTION public.moderate_content(
  p_entity_id uuid,
  p_entity_type text,
  p_new_status text
)
RETURNS void AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Ensure caller is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coadmin', 'superadmin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_new_status NOT IN ('approved', 'rejected', 'deleted') THEN
    RAISE EXCEPTION 'Invalid status. Must be approved, rejected, or deleted.';
  END IF;

  -- Verify existence and get the owner of the content
  IF p_entity_type = 'post' THEN
    SELECT user_id INTO v_owner_id FROM public.posts WHERE id = p_entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Post not found'; END IF;
    
    IF p_new_status = 'deleted' THEN
      DELETE FROM public.posts WHERE id = p_entity_id;
    ELSIF p_new_status = 'rejected' THEN
      UPDATE public.posts 
        SET status = 'rejected', rejected_at = NOW() 
        WHERE id = p_entity_id;
    ELSE
      -- approved: clear rejected_at
      UPDATE public.posts 
        SET status = p_new_status, rejected_at = NULL 
        WHERE id = p_entity_id;
    END IF;

  ELSIF p_entity_type = 'comment' THEN
    SELECT user_id INTO v_owner_id FROM public.comments WHERE id = p_entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Comment not found'; END IF;
    
    IF p_new_status = 'deleted' THEN
      DELETE FROM public.comments WHERE id = p_entity_id;
    ELSIF p_new_status = 'rejected' THEN
      UPDATE public.comments 
        SET status = 'rejected', rejected_at = NOW() 
        WHERE id = p_entity_id;
    ELSE
      -- approved: clear rejected_at
      UPDATE public.comments 
        SET status = p_new_status, rejected_at = NULL 
        WHERE id = p_entity_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid entity type';
  END IF;

  -- Add manual log for audit trailing
  INSERT INTO public.ai_moderation_logs (entity_id, entity_type, action, reason)
  VALUES (p_entity_id, p_entity_type, p_new_status, 'Manual moderation by Admin');

  -- Send a specific notification to the owner if the content was rejected or deleted
  IF p_new_status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (v_owner_id, auth.uid(), 'mod_rejected', p_entity_id);
  ELSIF p_new_status = 'deleted' THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
    VALUES (v_owner_id, auth.uid(), 'mod_deleted', p_entity_id);
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Mövcud rejected postlara da rejected_at tarix ver (geriyə uyğunluq üçün)
UPDATE public.posts 
  SET rejected_at = created_at 
  WHERE status = 'rejected' AND rejected_at IS NULL;

UPDATE public.comments 
  SET rejected_at = created_at 
  WHERE status = 'rejected' AND rejected_at IS NULL;

-- 5. rejected_at-a index əlavə et (cleanup query-nin sürətli işləməsi üçün)
CREATE INDEX IF NOT EXISTS idx_posts_rejected_at ON public.posts (rejected_at) WHERE status = 'rejected';
CREATE INDEX IF NOT EXISTS idx_comments_rejected_at ON public.comments (rejected_at) WHERE status = 'rejected';
