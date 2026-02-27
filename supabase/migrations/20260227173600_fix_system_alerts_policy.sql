-- Add a policy for admins/coadmins to see ALL alerts (even inactive)
CREATE POLICY "Admins can view all system alerts"
ON public.system_alerts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'coadmin')
  )
);

-- Add a policy for admins/coadmins to insert alerts
CREATE POLICY "Admins can insert system alerts"
ON public.system_alerts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'coadmin')
  )
);

-- Add a policy for admins/coadmins to update alerts
CREATE POLICY "Admins can update system alerts"
ON public.system_alerts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'coadmin')
  )
);

-- Add a policy for admins/coadmins to delete alerts
CREATE POLICY "Admins can delete system alerts"
ON public.system_alerts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'coadmin')
  )
);
