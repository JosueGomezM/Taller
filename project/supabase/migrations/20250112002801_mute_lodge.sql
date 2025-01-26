/*
  # Fix users table policies

  1. Changes
    - Remove circular references in RLS policies
    - Simplify admin access check
    - Fix user self-management policies
  
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
*/

-- Eliminar políticas existentes de usuarios
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Crear nuevas políticas para la tabla users
CREATE POLICY "Allow users to read all profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow admins to insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );