/*
  # Create AI Providers Table

  1. New Tables
    - `ai_providers`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `api_key_encrypted` (text, nullable)
      - `selected_model` (text, nullable)
      - `is_active` (boolean, default true)
      - `is_global_default` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ai_providers` table
    - Add policy for admins to manage AI providers
    - Add policy for authenticated users to read active providers

  3. Initial Data
    - Insert default AI providers (OpenAI, Anthropic, Google)
*/

CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  api_key_encrypted text,
  selected_model text,
  is_active boolean DEFAULT true NOT NULL,
  is_global_default boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage AI providers
CREATE POLICY "Admins can manage AI providers"
  ON ai_providers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

-- Policy for authenticated users to read active providers
CREATE POLICY "Users can view active AI providers"
  ON ai_providers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default AI providers
INSERT INTO ai_providers (name, is_active, is_global_default) VALUES
  ('OpenAI', true, true),
  ('Anthropic', true, false),
  ('Google AI', true, false)
ON CONFLICT (name) DO NOTHING;