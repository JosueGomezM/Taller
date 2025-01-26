-- Add updated_at column to repair_comments table
ALTER TABLE repair_comments 
ADD COLUMN IF NOT EXISTS updated_at timestamptz 
DEFAULT now();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_repair_comments_updated_at
    BEFORE UPDATE ON repair_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing comments to have current timestamp
UPDATE repair_comments 
SET updated_at = now() 
WHERE updated_at IS NULL;