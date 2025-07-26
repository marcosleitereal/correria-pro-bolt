/*
  # Corrigir Colunas da Tabela plans

  1. Alterações na Tabela plans
    - Renomear `athlete_limit` para `max_athletes` (se necessário)
    - Adicionar colunas ausentes conforme usado na plataforma
    - Adicionar `is_popular` (boolean)
    - Corrigir tipos de dados

  2. Segurança
    - Manter RLS existente
*/

-- Verificar e corrigir estrutura da tabela plans
DO $$
BEGIN
  -- Adicionar is_popular se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'is_popular'
  ) THEN
    ALTER TABLE plans ADD COLUMN is_popular boolean DEFAULT false;
  END IF;

  -- Adicionar price_yearly se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'price_yearly'
  ) THEN
    ALTER TABLE plans ADD COLUMN price_yearly numeric(10,2);
  END IF;

  -- Adicionar max_trainings_per_month se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'max_trainings_per_month'
  ) THEN
    ALTER TABLE plans ADD COLUMN max_trainings_per_month integer;
  END IF;

  -- Adicionar stripe_price_id_monthly se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'stripe_price_id_monthly'
  ) THEN
    ALTER TABLE plans ADD COLUMN stripe_price_id_monthly text;
  END IF;

  -- Adicionar stripe_price_id_yearly se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'stripe_price_id_yearly'
  ) THEN
    ALTER TABLE plans ADD COLUMN stripe_price_id_yearly text;
  END IF;

  -- Renomear athlete_limit para max_athletes se necessário
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'athlete_limit'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'max_athletes'
  ) THEN
    ALTER TABLE plans RENAME COLUMN athlete_limit TO max_athletes;
  END IF;

  -- Se max_athletes não existir, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'max_athletes'
  ) THEN
    ALTER TABLE plans ADD COLUMN max_athletes integer NOT NULL DEFAULT 10;
  END IF;
END $$;