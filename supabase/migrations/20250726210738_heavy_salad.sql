/*
  # Fix subscriptions RLS policies for upsert operations

  1. Security Updates
    - Drop existing problematic INSERT policy
    - Create new INSERT policy that works with upsert operations
    - Add UPDATE policy for upsert operations
    - Ensure policies use auth.uid() consistently

  2. Policy Details
    - INSERT: Allow authenticated users to create subscriptions for themselves
    - UPDATE: Allow authenticated users to update their own subscriptions
    - Both policies use auth.uid() = user_id for security
*/

-- Drop existing INSERT policy that might be causing issues
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;

-- Create new INSERT policy that works with upsert
CREATE POLICY "Authenticated users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy for upsert operations
CREATE POLICY "Authenticated users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);