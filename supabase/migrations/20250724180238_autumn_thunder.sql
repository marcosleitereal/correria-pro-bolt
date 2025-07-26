/*
  # Corrigir Schema da Tabela runners

  1. Alterações na Tabela runners
    - Adicionar coluna `gender` (text)
    - Adicionar coluna `weight_kg` (numeric)
    - Adicionar coluna `height_cm` (integer)
    - Adicionar coluna `main_goal` (text)
    - Adicionar coluna `fitness_level` (text) com valores específicos
    - Adicionar coluna `resting_heart_rate` (integer)
    - Adicionar coluna `max_heart_rate` (integer)
    - Adicionar coluna `notes` (text)
    - Adicionar coluna `is_archived` (boolean)

  2. Segurança
    - Manter RLS existente
    - Políticas já configuradas funcionarão com novas colunas
*/

-- Adicionar colunas ausentes na tabela runners
DO $$
BEGIN
  -- Adicionar gender se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'gender'
  ) THEN
    ALTER TABLE runners ADD COLUMN gender text;
  END IF;

  -- Adicionar weight_kg se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'weight_kg'
  ) THEN
    ALTER TABLE runners ADD COLUMN weight_kg numeric(5,2);
  END IF;

  -- Adicionar height_cm se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'height_cm'
  ) THEN
    ALTER TABLE runners ADD COLUMN height_cm integer;
  END IF;

  -- Adicionar main_goal se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'main_goal'
  ) THEN
    ALTER TABLE runners ADD COLUMN main_goal text;
  END IF;

  -- Adicionar fitness_level se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'fitness_level'
  ) THEN
    ALTER TABLE runners ADD COLUMN fitness_level text DEFAULT 'beginner';
  END IF;

  -- Adicionar resting_heart_rate se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'resting_heart_rate'
  ) THEN
    ALTER TABLE runners ADD COLUMN resting_heart_rate integer;
  END IF;

  -- Adicionar max_heart_rate se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'max_heart_rate'
  ) THEN
    ALTER TABLE runners ADD COLUMN max_heart_rate integer;
  END IF;

  -- Adicionar notes se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'notes'
  ) THEN
    ALTER TABLE runners ADD COLUMN notes text;
  END IF;

  -- Adicionar is_archived se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE runners ADD COLUMN is_archived boolean DEFAULT false;
  END IF;
END $$;

-- Adicionar constraints para fitness_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'runners_fitness_level_check'
  ) THEN
    ALTER TABLE runners ADD CONSTRAINT runners_fitness_level_check 
    CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'professional'));
  END IF;
END $$;

-- Adicionar constraints para gender
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'runners_gender_check'
  ) THEN
    ALTER TABLE runners ADD CONSTRAINT runners_gender_check 
    CHECK (gender IN ('masculino', 'feminino', 'outro'));
  END IF;
END $$;