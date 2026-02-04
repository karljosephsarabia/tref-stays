-- Allow pending properties to be visible on homepage (listed properties show immediately)
DROP POLICY IF EXISTS "Anyone can view active or approved properties" ON public.properties;

CREATE POLICY "Anyone can view active, approved, or pending properties"
  ON public.properties FOR SELECT
  USING (
    status IN ('active', 'approved', 'pending')
    OR auth.uid() = owner_id
  );
