/*
  # Fix subscriptions table RLS policy for inserts

  1. Security Changes
    - Add INSERT policy for authenticated users to create their own subscriptions
    - Users can only insert subscriptions where user_id matches their auth.uid()
    
  2. Policy Details
    - Policy name: "Users can insert own subscriptions"
    - Target: authenticated users
    - Action: INSERT
    - Check: auth.uid() = user_id
*/

-- Add INSERT policy for subscriptions table
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);