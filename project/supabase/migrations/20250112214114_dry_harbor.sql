-- Add status field to repair_comments table
ALTER TABLE repair_comments 
ADD COLUMN IF NOT EXISTS status text 
CHECK (status IN ('pending', 'read')) 
NOT NULL 
DEFAULT 'pending';

-- Update existing comments to have 'read' status
UPDATE repair_comments 
SET status = 'read' 
WHERE status IS NULL;