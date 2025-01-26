-- Drop existing repair policies
DROP POLICY IF EXISTS "Users can read all repairs" ON repairs;
DROP POLICY IF EXISTS "Mechanics can manage their assigned repairs" ON repairs;

-- Create new policies
CREATE POLICY "Users can read all repairs"
  ON repairs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mechanics can update their assigned repairs"
  ON repairs
  FOR UPDATE
  TO authenticated
  USING (mechanic_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ))
  WITH CHECK (mechanic_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "Mechanics can create repairs"
  ON repairs
  FOR INSERT
  TO authenticated
  WITH CHECK (mechanic_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));