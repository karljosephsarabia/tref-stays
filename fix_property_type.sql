-- Migration to change property_type from integer to varchar
-- This fixes the charAt error by storing property type as text

-- Change property_type from integer to varchar
ALTER TABLE rs_properties 
ALTER COLUMN property_type TYPE VARCHAR(50);

-- Update any integer values to proper strings (if any exist)
-- Map common property type IDs to their string equivalents
UPDATE rs_properties 
SET property_type = CASE property_type
  WHEN '1' THEN 'apartment'
  WHEN '2' THEN 'house'
  WHEN '3' THEN 'condo'
  WHEN '4' THEN 'townhouse'
  WHEN '5' THEN 'villa'
  WHEN '6' THEN 'cottage'
  WHEN '7' THEN 'cabin'
  WHEN '8' THEN 'bungalow'
  ELSE property_type
END
WHERE property_type ~ '^\d+$'; -- Only update if it's a number

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rs_properties' 
AND column_name = 'property_type';
