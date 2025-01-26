/*
  # Add user insert policy
  
  1. Changes
    - Add policy to allow authenticated users to create their own profile
  
  2. Security
    - Users can only create a profile with their own auth.uid()
    - Maintains existing RLS policies
*/

CREATE POLICY "Users can create their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);