-- Add status column to rs_reservations table
ALTER TABLE rs_reservations 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Add check constraint to ensure valid status values
ALTER TABLE rs_reservations
ADD CONSTRAINT rs_reservations_status_check 
CHECK (status IN ('pending', 'confirmed', 'approved', 'cancelled', 'completed'));

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_rs_reservations_status 
ON rs_reservations(status);

-- Update existing reservations to have pending status
UPDATE rs_reservations 
SET status = 'pending' 
WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN rs_reservations.status IS 'Reservation status: pending, confirmed, approved, cancelled, or completed';
