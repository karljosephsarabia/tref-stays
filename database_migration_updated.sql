-- Updated migration script based on existing rs_properties table structure
-- Only adds missing columns and converts amenities from TEXT to JSONB

-- Add currency field if it doesn't exist (default USD)
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add address field if it doesn't exist (city, state, country, zipcode already exist)
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS address TEXT;

-- Convert amenities from TEXT to JSONB (column already exists)
-- First, handle existing TEXT data by converting empty/null to '[]'
UPDATE rs_properties 
SET amenities = '[]' 
WHERE amenities IS NULL OR amenities = '';

-- Convert non-empty text to JSON array format if not already JSON
UPDATE rs_properties 
SET amenities = '[]'
WHERE amenities IS NOT NULL 
  AND amenities != '' 
  AND amenities NOT LIKE '[%'
  AND amenities NOT LIKE '{%';

-- Now alter the column type to JSONB
ALTER TABLE rs_properties 
ALTER COLUMN amenities TYPE JSONB 
USING CASE 
  WHEN amenities IS NULL OR amenities = '' THEN '[]'::jsonb
  ELSE amenities::jsonb
END;

-- Set default value for amenities
ALTER TABLE rs_properties 
ALTER COLUMN amenities SET DEFAULT '[]'::jsonb;

-- Add kosher features
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS kosher_kitchen BOOLEAN DEFAULT false;
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS shabbos_friendly BOOLEAN DEFAULT false;

-- Add nearby facilities
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS nearby_shul VARCHAR(255);
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS nearby_shul_distance VARCHAR(50);
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS nearby_kosher_shops VARCHAR(255);
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS nearby_kosher_shops_distance VARCHAR(50);
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS nearby_mikva VARCHAR(255);
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS nearby_mikva_distance VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rs_properties_currency ON rs_properties(currency);
CREATE INDEX IF NOT EXISTS idx_rs_properties_city ON rs_properties(city);
CREATE INDEX IF NOT EXISTS idx_rs_properties_country ON rs_properties(country);
CREATE INDEX IF NOT EXISTS idx_rs_properties_kosher_kitchen ON rs_properties(kosher_kitchen);
CREATE INDEX IF NOT EXISTS idx_rs_properties_amenities ON rs_properties USING gin(amenities);

-- Update existing properties with default values
UPDATE rs_properties SET currency = 'USD' WHERE currency IS NULL;
UPDATE rs_properties SET amenities = '[]'::jsonb WHERE amenities IS NULL;
UPDATE rs_properties SET kosher_kitchen = false WHERE kosher_kitchen IS NULL;
UPDATE rs_properties SET shabbos_friendly = false WHERE shabbos_friendly IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rs_properties'
  AND column_name IN ('currency', 'address', 'amenities', 'kosher_kitchen', 'shabbos_friendly', 
                      'nearby_shul', 'nearby_shul_distance', 'nearby_kosher_shops', 
                      'nearby_kosher_shops_distance', 'nearby_mikva', 'nearby_mikva_distance')
ORDER BY ordinal_position;
