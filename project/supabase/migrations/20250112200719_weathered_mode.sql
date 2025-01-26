-- Drop existing repair policies
DROP POLICY IF EXISTS "Users can read all repairs" ON repairs;
DROP POLICY IF EXISTS "Users can manage repairs" ON repairs;

-- Create new policies
CREATE POLICY "Anyone can read repairs"
  ON repairs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert repairs"
  ON repairs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update repairs"
  ON repairs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: We're intentionally making the policies more permissive to allow mechanics
-- to manage repair statuses. The application logic in the frontend already handles
-- role-based access control for creating new repairs.