-- Drop existing policies for repair_comments
DROP POLICY IF EXISTS "Users can read all repair comments" ON repair_comments;
DROP POLICY IF EXISTS "Users can create and manage their own comments" ON repair_comments;

-- Create new policies for repair_comments
CREATE POLICY "Anyone can read repair comments"
  ON repair_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON repair_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update comments"
  ON repair_comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );