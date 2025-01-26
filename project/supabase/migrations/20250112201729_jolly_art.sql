/*
  # Fix repair management permissions

  1. Changes
    - Simplify repair policies to allow both mechanics and admins to manage repairs
    - Remove unnecessary complexity in policy checks
    - Ensure proper access for status updates
  
  2. Security
    - Maintain basic authentication check
    - Allow authenticated users to perform necessary operations
    - Frontend handles role-based access control
*/

-- Drop existing repair policies
DROP POLICY IF EXISTS "Anyone can read repairs" ON repairs;
DROP POLICY IF EXISTS "Anyone can insert repairs" ON repairs;
DROP POLICY IF EXISTS "Anyone can update repairs" ON repairs;

-- Create simplified policies that work with the frontend role checks
CREATE POLICY "Authenticated users can read repairs"
  ON repairs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage repairs"
  ON repairs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Note: The frontend application handles the business logic for:
-- 1. Only allowing mechanics to manage their own repairs
-- 2. Allowing admins to manage all repairs
-- 3. Controlling repair status transitions