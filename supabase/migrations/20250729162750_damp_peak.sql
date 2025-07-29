/*
  # Adicionar campos de anamnese à tabela runners

  1. Novos Campos
    - `injuries` (jsonb) - Histórico de lesões estruturado
    - `health_conditions` (jsonb) - Condições de saúde estruturadas  
    - `past_training_experience` (text) - Experiência de treino passada
    - `physical_characteristics` (jsonb) - Características físicas (pisada, biotipo, etc.)
    - `dietary_preferences` (text) - Preferências/restrições alimentares

  2. Segurança
    - Campos são opcionais (nullable)
    - Mantém compatibilidade com dados existentes
*/

-- Adicionar novos campos à tabela runners
DO $$
BEGIN
  -- Adicionar campo injuries se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'injuries'
  ) THEN
    ALTER TABLE runners ADD COLUMN injuries jsonb;
  END IF;

  -- Adicionar campo health_conditions se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'health_conditions'
  ) THEN
    ALTER TABLE runners ADD COLUMN health_conditions jsonb;
  END IF;

  -- Adicionar campo past_training_experience se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'past_training_experience'
  ) THEN
    ALTER TABLE runners ADD COLUMN past_training_experience text;
  END IF;

  -- Adicionar campo physical_characteristics se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'physical_characteristics'
  ) THEN
    ALTER TABLE runners ADD COLUMN physical_characteristics jsonb;
  END IF;

  -- Adicionar campo dietary_preferences se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'runners' AND column_name = 'dietary_preferences'
  ) THEN
    ALTER TABLE runners ADD COLUMN dietary_preferences text;
  END IF;
END $$;