/*
  # Fix RLS policies for users table

  1. Changes
    - Drop existing policies
    - Create new policies that allow:
      - Any authenticated user to read all users
      - Users to create their own profile during signup
      - Users to update their own profile
      - Admins to manage all users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read all profiles" ON users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON users;
DROP POLICY IF EXISTS "Allow admins to insert users" ON users;

-- Create new policies
CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'::user_role
    )
  );