-- 1. Add status column if missing (Safe to re-run)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversation_participants' AND column_name = 'status') THEN
        ALTER TABLE public.conversation_participants 
        ADD COLUMN status text DEFAULT 'accepted' CHECK (status IN ('accepted', 'pending', 'ignored', 'blocked'));
    END IF;
END $$;

-- 2. Update start_direct_conversation RPC (Safe to re-run)
CREATE OR REPLACE FUNCTION public.start_direct_conversation(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  existing_conc_id uuid;
  new_conv_id uuid;
  recipient_follows_sender boolean;
  recipient_status text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot start conversation with yourself';
  END IF;

  SELECT c.id INTO existing_conc_id
  FROM conversations c
  JOIN conversation_participants p1 ON c.id = p1.conversation_id
  JOIN conversation_participants p2 ON c.id = p2.conversation_id
  WHERE p1.user_id = current_user_id
  AND p2.user_id = other_user_id
  AND c.is_group = false
  LIMIT 1;

  IF existing_conc_id IS NOT NULL THEN
    RETURN existing_conc_id;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = other_user_id 
    AND following_id = current_user_id
  ) INTO recipient_follows_sender;

  IF recipient_follows_sender THEN
    recipient_status := 'accepted';
  ELSE
    recipient_status := 'pending';
  END IF;

  INSERT INTO conversations (is_group, last_message)
  VALUES (false, NULL)
  RETURNING id INTO new_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id, status)
  VALUES 
    (new_conv_id, current_user_id, 'accepted'),
    (new_conv_id, other_user_id, recipient_status);

  RETURN new_conv_id;
END;
$$;

-- 3. Fix RLS Policies (CRITICAL FIX FOR RECURSION)

-- Helper function to safely get my conversation IDs without triggering recursion
-- SECURITY DEFINER allows this function to bypass the RLS on conversation_participants itself
CREATE OR REPLACE FUNCTION get_my_conversation_ids()
RETURNS TABLE (conversation_id uuid) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT cp.conversation_id FROM conversation_participants cp WHERE cp.user_id = auth.uid();
END;
$$;

-- Profiles: Public
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Conversation Participants: View participants of my conversations
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants FOR SELECT
USING (
  conversation_id IN ( SELECT conversation_id FROM get_my_conversation_ids() )
);

-- Messages: View messages in my conversations
-- Also using the helper for consistency/performance, though direct query might work since it's a different table
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.direct_messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
  conversation_id IN ( SELECT conversation_id FROM get_my_conversation_ids() )
);

-- Messages: Send messages
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.direct_messages;
CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  conversation_id IN ( SELECT conversation_id FROM get_my_conversation_ids() )
);
