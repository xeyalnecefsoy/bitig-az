-- Set xeyalnecefsoy@gmail.com as admin
-- Run this in Supabase SQL Editor

UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'xeyalnecefsoy@gmail.com'
);

-- Verify
SELECT id, username, role, email 
FROM profiles 
WHERE role = 'admin';
