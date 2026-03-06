-- ============================================
-- Security: Fix is_admin() and add role change protection
-- ============================================

-- 1. Fix is_admin() to include coadmin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'coadmin')
  );
END;
$$;

-- 2. Prevent unauthorized role escalation
-- Only admins can set someone's role to 'admin'
-- Co-admins cannot modify other admins' roles
CREATE OR REPLACE FUNCTION prevent_unauthorized_role_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get the role of the user making the change
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();

  -- If trying to set role to 'admin', only existing admins can do this
  IF NEW.role = 'admin' AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can promote users to admin role';
  END IF;

  -- If the target user is already an admin, only another admin can change their role
  IF OLD.role = 'admin' AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can modify admin accounts';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS check_role_changes ON profiles;
CREATE TRIGGER check_role_changes
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_unauthorized_role_changes();
