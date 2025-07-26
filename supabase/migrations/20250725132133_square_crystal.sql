/*
  # Create AI Settings Table

  1. New Tables
    - `ai_settings`
      - `id` (uuid, primary key)
      - `setting_name` (text, unique, not null)
      - `setting_value` (text, nullable)
      - `updated_by` (uuid, foreign key to auth.users)
      - `updated_at` (timestamp with time zone, auto-update)

  2. Security
    - Enable RLS on `ai_settings` table
    - Add policy for authenticated users to read settings
    - Add policy for admins to manage settings

  3. Indexes
    - Index on setting_name for fast lookups
    - Index on updated_by for tracking changes
*/

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_name text UNIQUE NOT NULL,
  setting_value text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view AI settings"
  ON ai_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage AI settings"
  ON ai_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ai_settings_setting_name_idx ON ai_settings(setting_name);
CREATE INDEX IF NOT EXISTS ai_settings_updated_by_idx ON ai_settings(updated_by);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_settings_updated_at
    BEFORE UPDATE ON ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();