-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for own profile or admin" ON users;
DROP POLICY IF EXISTS "Enable delete for admin only" ON users;

-- Create simplified policies
CREATE POLICY "Allow all authenticated users to read users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policy for admin operations
CREATE POLICY "Allow admin to manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );