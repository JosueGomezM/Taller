/*
  # Disable Email Confirmation Requirement

  1. Changes
    - Disable email confirmation requirement for sign-ups
    - Allow users to sign in without confirming their email

  2. Security Note
    - This is safe for development but in production you might want to re-enable email confirmation
*/

-- Disable email confirmation requirement
ALTER TABLE auth.users
ALTER COLUMN email_confirmed_at
SET DEFAULT NOW();

-- Update existing users to have confirmed emails
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;