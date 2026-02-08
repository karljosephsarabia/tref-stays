-- Migration script to add all restored fields to rs_properties table
-- Run this on your Render PostgreSQL database

-- Add currency field (default USD)
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add full location fields
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS country VARCHAR(2);

-- Add amenities as JSON/JSONB
ALTER TABLE rs_properties ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

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

-- Update existing properties with default values (optional)
-- UPDATE rs_properties SET currency = 'USD' WHERE currency IS NULL;
-- UPDATE rs_properties SET amenities = '[]'::jsonb WHERE amenities IS NULL;
-- UPDATE rs_properties SET kosher_kitchen = false WHERE kosher_kitchen IS NULL;
-- UPDATE rs_properties SET shabbos_friendly = false WHERE shabbos_friendly IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rs_properties'
ORDER BY ordinal_position;
