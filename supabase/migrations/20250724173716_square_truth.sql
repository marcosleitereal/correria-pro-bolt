/*
  # Create Admin Settings Table

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique, not null)
      - `setting_value` (text, nullable)
      - `updated_by` (uuid, foreign key to auth.users)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `admin_settings` table
    - Add policy for admins to manage settings
    - Add policy for authenticated users to read settings

  3. Initial Data
    - Insert default global AI provider setting
*/

CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage settings
CREATE POLICY "Admins can manage settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

-- Policy for authenticated users to read settings
CREATE POLICY "Users can view settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default global AI provider setting
INSERT INTO admin_settings (setting_key, setting_value) VALUES
  ('global_ai_provider', 'OpenAI')
ON CONFLICT (setting_key) DO NOTHING;