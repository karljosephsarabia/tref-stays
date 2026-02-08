-- Add custom_kosher_amenities and custom_nearby_places columns to rs_properties table

-- Add custom_kosher_amenities column (JSON array of strings)
ALTER TABLE rs_properties 
ADD COLUMN IF NOT EXISTS custom_kosher_amenities TEXT DEFAULT '[]';

-- Add custom_nearby_places column (JSON array of objects with type, name, distance)
ALTER TABLE rs_properties 
ADD COLUMN IF NOT EXISTS custom_nearby_places TEXT DEFAULT '[]';

-- Add comments to describe the columns
COMMENT ON COLUMN rs_properties.custom_kosher_amenities IS 'JSON array of custom kosher amenity names added by property owner';
COMMENT ON COLUMN rs_properties.custom_nearby_places IS 'JSON array of custom nearby places with {type, name, distance} fields';
