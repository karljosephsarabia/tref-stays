-- Create property_availability table for managing blocked dates and bookings
CREATE TABLE IF NOT EXISTS property_availability (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('blocked', 'booked')),
  reservation_id INTEGER NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  CONSTRAINT fk_property
    FOREIGN KEY (property_id)
    REFERENCES rs_properties(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_reservation
    FOREIGN KEY (reservation_id)
    REFERENCES rs_reservations(id)
    ON DELETE CASCADE,
  
  -- Date validation
  CONSTRAINT valid_date_range
    CHECK (end_date >= start_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_availability_property
  ON property_availability(property_id);

CREATE INDEX IF NOT EXISTS idx_property_availability_dates
  ON property_availability(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_property_availability_status
  ON property_availability(status);

-- Function to check for overlapping date ranges
CREATE OR REPLACE FUNCTION check_availability_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new date range overlaps with any existing blocked or booked dates
  IF EXISTS (
    SELECT 1 FROM property_availability
    WHERE property_id = NEW.property_id
    AND id != COALESCE(NEW.id, 0)
    AND status IN ('blocked', 'booked')
    AND (
      (start_date <= NEW.start_date AND end_date >= NEW.start_date)
      OR (start_date <= NEW.end_date AND end_date >= NEW.end_date)
      OR (start_date >= NEW.start_date AND end_date <= NEW.end_date)
    )
  ) THEN
    RAISE EXCEPTION 'Date range overlaps with existing booking or block for this property';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent overlapping bookings/blocks
DROP TRIGGER IF EXISTS prevent_availability_overlap ON property_availability;
CREATE TRIGGER prevent_availability_overlap
  BEFORE INSERT OR UPDATE ON property_availability
  FOR EACH ROW
  EXECUTE FUNCTION check_availability_overlap();

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_property_availability_updated_at ON property_availability;
CREATE TRIGGER update_property_availability_updated_at
  BEFORE UPDATE ON property_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your user)
-- GRANT ALL PRIVILEGES ON property_availability TO your_db_user;
-- GRANT USAGE, SELECT ON SEQUENCE property_availability_id_seq TO your_db_user;
