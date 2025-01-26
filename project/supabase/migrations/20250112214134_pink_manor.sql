-- Add updated_at column to repair_comments table if it doesn't exist
DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'repair_comments' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE repair_comments 
        ADD COLUMN updated_at timestamptz 
        DEFAULT now();
    END IF;
END $$;

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and create it again
DO $$ 
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS update_repair_comments_updated_at
    ON repair_comments;
    
    -- Create the trigger
    CREATE TRIGGER update_repair_comments_updated_at
        BEFORE UPDATE ON repair_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Update existing comments to have current timestamp if needed
UPDATE repair_comments 
SET updated_at = now() 
WHERE updated_at IS NULL;