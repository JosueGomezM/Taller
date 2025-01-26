-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_repair_comments_updated_at ON repair_comments;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create new function with security definer and search path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Recreate trigger with new function
CREATE TRIGGER update_repair_comments_updated_at
    BEFORE UPDATE ON repair_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();