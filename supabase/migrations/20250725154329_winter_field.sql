/*
  # Fix audit_logs RLS policies

  1. Security Changes
    - Remove INSERT policy for authenticated users
    - Ensure only service role (Edge Functions) can insert audit logs
    - Maintain SELECT policy for admins only
  
  2. Rationale
    - Audit logs should only be created server-side for integrity
    - Prevents client-side manipulation of audit data
    - Ensures all audit entries are legitimate and controlled
*/

-- Remove existing INSERT policy that allows authenticated users
DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

-- Ensure only admins can view audit logs (keep existing SELECT policy)
-- The existing SELECT policy should remain as is

-- Add explicit DENY policy for INSERT operations from client-side
CREATE POLICY "Deny client-side audit log inserts"
  ON audit_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- Note: Edge Functions use service_role key which bypasses RLS,
-- so they can still insert audit logs as intended