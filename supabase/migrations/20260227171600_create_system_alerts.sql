-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'error', 'maintenance')) DEFAULT 'info',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active alerts view policy
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active alerts"
ON public.system_alerts FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Enable Realtime for the system_alerts table
BEGIN;
  -- remove the supabase_realtime publication
  DROP PUBLICATION IF EXISTS supabase_realtime;

  -- re-create the supabase_realtime publication with no tables
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- add a table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_alerts;
