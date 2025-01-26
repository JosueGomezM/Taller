/*
  # Fix authentication and RLS policies

  1. Changes
    - Simplify user policies to avoid recursion
    - Fix user creation and management permissions
    - Ensure proper authentication flow

  2. Security
    - Maintain RLS protection
    - Allow proper user creation and management
    - Fix infinite recursion in policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create simplified policies
CREATE POLICY "Enable read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile or admins to create any profile
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'jgomez@multiecocr.com'
    )
  );

CREATE POLICY "Enable update for own profile or admin"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile or admins can update any profile
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'jgomez@multiecocr.com'
    )
  )
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'jgomez@multiecocr.com'
    )
  );

CREATE POLICY "Enable delete for admin only"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'jgomez@multiecocr.com'
    )
  );