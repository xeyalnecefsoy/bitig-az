-- Function to check if user is admin (bypassing RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on books table
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Allow everyone (anon and authenticated) to view books
DROP POLICY IF EXISTS "Public books are viewable by everyone" ON books;
CREATE POLICY "Public books are viewable by everyone"
  ON books FOR SELECT
  USING (true);

-- Allow admins to insert, update, delete books
DROP POLICY IF EXISTS "Admins can manage books" ON books;
CREATE POLICY "Admins can manage books"
  ON books FOR ALL
  USING (is_admin());

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view basic profile info
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow admins to manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin());
