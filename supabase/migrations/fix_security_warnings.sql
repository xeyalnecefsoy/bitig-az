-- ============================================
-- Fix Security Advisor Warnings
-- Add search_path to SECURITY DEFINER functions
-- ============================================

-- Fix is_admin function - add search_path
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Fix increment_impressions function - add search_path
CREATE OR REPLACE FUNCTION increment_impressions(ad_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sponsors
  SET impressions = impressions + 1
  WHERE id = ad_id;
END;
$$;

-- Fix increment_clicks function - add search_path
CREATE OR REPLACE FUNCTION increment_clicks(ad_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sponsors
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$;
