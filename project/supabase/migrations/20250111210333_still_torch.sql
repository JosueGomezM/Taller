/*
  # Workshop Management System Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `role` (enum: admin, mechanic)
      - `full_name` (text)
      - `created_at` (timestamptz)
    
    - `vehicles`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `type` (enum: truck, machinery)
      - `model` (text)
      - `brand` (text)
      - `year` (integer)
      - `serial_number` (text)
      - `created_at` (timestamptz)
    
    - `repairs`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, foreign key)
      - `mechanic_id` (uuid, foreign key)
      - `status` (enum: pending, in_progress, completed)
      - `description` (text)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `repair_comments`
      - `id` (uuid, primary key)
      - `repair_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `comment` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on their role
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'mechanic');
CREATE TYPE vehicle_type AS ENUM ('truck', 'machinery');
CREATE TYPE repair_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'mechanic',
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type vehicle_type NOT NULL,
  model text NOT NULL,
  brand text NOT NULL,
  year integer NOT NULL,
  serial_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create repairs table
CREATE TABLE IF NOT EXISTS repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  mechanic_id uuid NOT NULL REFERENCES users(id),
  status repair_status NOT NULL DEFAULT 'pending',
  description text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create repair_comments table
CREATE TABLE IF NOT EXISTS repair_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL REFERENCES repairs(id),
  user_id uuid NOT NULL REFERENCES users(id),
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for vehicles table
CREATE POLICY "Users can read all vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicles"
  ON vehicles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policies for repairs table
CREATE POLICY "Users can read all repairs"
  ON repairs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mechanics can manage their assigned repairs"
  ON repairs
  FOR ALL
  TO authenticated
  USING (
    mechanic_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policies for repair_comments table
CREATE POLICY "Users can read all repair comments"
  ON repair_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create and manage their own comments"
  ON repair_comments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());