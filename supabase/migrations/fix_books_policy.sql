-- Enable RLS on books table if not already enabled
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Books are viewable by everyone" ON books;

-- Create a policy that allows anyone to view books
CREATE POLICY "Books are viewable by everyone" 
ON books FOR SELECT 
USING (true);
