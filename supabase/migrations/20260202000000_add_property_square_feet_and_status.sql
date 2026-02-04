-- Add square_feet (area) column to properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS square_feet NUMERIC(10, 2);

COMMENT ON COLUMN public.properties.square_feet IS 'Property area in square feet';

-- Ensure status supports active, pending, sold (existing column is TEXT, no enum change needed)
-- Update RLS so public can view properties with status 'active' or 'approved'
DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;

CREATE POLICY "Anyone can view active or approved properties"
  ON public.properties FOR SELECT
  USING (
    status IN ('active', 'approved')
    OR auth.uid() = owner_id
  );
