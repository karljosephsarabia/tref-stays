-- Create saved properties table
CREATE TABLE IF NOT EXISTS rs_saved_properties (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES rs_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES rs_properties(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_property UNIQUE (user_id, property_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON rs_saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON rs_saved_properties(property_id);

-- Add comment for documentation
COMMENT ON TABLE rs_saved_properties IS 'Stores user favorite/saved properties';
COMMENT ON COLUMN rs_saved_properties.user_id IS 'The user who saved the property';
COMMENT ON COLUMN rs_saved_properties.property_id IS 'The property that was saved';
