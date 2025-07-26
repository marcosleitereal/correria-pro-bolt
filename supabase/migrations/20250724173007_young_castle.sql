/*
  # Create plans table

  1. New Tables
    - `plans`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `price_monthly` (numeric, not null)
      - `price_yearly` (numeric)
      - `max_athletes` (integer, not null)
      - `max_trainings_per_month` (integer)
      - `features` (jsonb)
      - `stripe_price_id_monthly` (text)
      - `stripe_price_id_yearly` (text)
      - `is_active` (boolean, default true)
      - `is_popular` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `plans` table
    - Add policy for authenticated users to read plans
    - Add policy for admins to manage plans

  3. Initial Data
    - Insert 3 default plans (Starter, Professional, Elite)
*/

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric(10,2) NOT NULL,
  price_yearly numeric(10,2),
  max_athletes integer NOT NULL,
  max_trainings_per_month integer,
  features jsonb DEFAULT '[]'::jsonb,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active plans"
  ON plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

-- Insert default plans
INSERT INTO plans (name, description, price_monthly, price_yearly, max_athletes, max_trainings_per_month, features, is_popular) VALUES
(
  'Starter',
  'Ideal para treinadores iniciantes',
  29.90,
  299.00,
  10,
  50,
  '["Gestão de até 10 atletas", "50 treinos por mês", "Suporte por email", "Relatórios básicos"]'::jsonb,
  false
),
(
  'Professional',
  'Para treinadores estabelecidos',
  79.90,
  799.00,
  50,
  200,
  '["Gestão de até 50 atletas", "200 treinos por mês", "Suporte prioritário", "Relatórios avançados", "API de integração", "Grupos de treino"]'::jsonb,
  true
),
(
  'Elite',
  'Para academias e grandes operações',
  199.90,
  1999.00,
  -1,
  -1,
  '["Atletas ilimitados", "Treinos ilimitados", "Suporte 24/7", "Relatórios personalizados", "API completa", "Grupos ilimitados", "Consultoria especializada"]'::jsonb,
  false
);