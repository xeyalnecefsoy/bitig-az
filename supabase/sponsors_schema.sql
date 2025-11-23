-- ============================================
-- Sponsors & Advertising System
-- Database Schema and Functions
-- ============================================

-- Create sponsors/ads table
CREATE TABLE IF NOT EXISTS sponsors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  company text NOT NULL,
  banner_url text NOT NULL,
  link_url text NOT NULL,
  placement text NOT NULL, -- 'homepage', 'audiobooks', 'social', 'sidebar'
  position integer DEFAULT 0, -- Order priority (higher = shown first)
  active boolean DEFAULT true,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Public can view active sponsors within date range
CREATE POLICY "Active sponsors are viewable by everyone"
  ON sponsors FOR SELECT
  USING (
    active = true 
    AND (start_date IS NULL OR start_date <= now()) 
    AND (end_date IS NULL OR end_date >= now())
  );

-- Only admins can manage sponsors
CREATE POLICY "Admins can manage sponsors"
  ON sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsors_placement ON sponsors(placement, active, position DESC);
CREATE INDEX IF NOT EXISTS idx_sponsors_dates ON sponsors(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sponsors_active ON sponsors(active);

-- Function to increment impressions (view count)
CREATE OR REPLACE FUNCTION increment_impressions(ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE sponsors
  SET impressions = impressions + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment clicks
CREATE OR REPLACE FUNCTION increment_clicks(ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE sponsors
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_impressions(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_clicks(uuid) TO authenticated, anon;
