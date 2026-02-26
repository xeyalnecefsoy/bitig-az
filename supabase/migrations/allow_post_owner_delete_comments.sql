-- Allow post owners to delete comments on their posts
-- This extends the existing "Users can delete own comments" policy

CREATE POLICY "Post owners can delete comments on their posts"
ON comments
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM posts WHERE posts.id = comments.post_id
  )
);
