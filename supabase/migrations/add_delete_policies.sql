-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" 
ON posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments" 
ON comments 
FOR DELETE 
USING (auth.uid() = user_id);
