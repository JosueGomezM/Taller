-- Drop existing repair policies
DROP POLICY IF EXISTS "Users can read all repairs" ON repairs;
DROP POLICY IF EXISTS "Mechanics can update their assigned repairs" ON repairs;
DROP POLICY IF EXISTS "Mechanics can create repairs" ON repairs;

-- Create new comprehensive policies
CREATE POLICY "Users can read all repairs"
  ON repairs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage repairs"
  ON repairs
  FOR ALL
  TO authenticated
  USING (
    -- Allow mechanics to manage their assigned repairs or admins to manage all repairs
    mechanic_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );