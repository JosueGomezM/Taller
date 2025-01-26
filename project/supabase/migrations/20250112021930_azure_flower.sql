-- Drop existing policies
DROP POLICY IF EXISTS "Allow all authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
DROP POLICY IF EXISTS "Allow admin to manage all users" ON users;

-- Create new policies without circular dependencies
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

-- Special policy for admin (using email instead of role to avoid recursion)
CREATE POLICY "Allow admin to manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'jgomez@multiecocr.com'
    )
  );