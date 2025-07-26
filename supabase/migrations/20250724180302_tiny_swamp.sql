/*
  # Adicionar Colunas Ausentes na Tabela trainings

  1. Alterações na Tabela trainings
    - Adicionar coluna `style_id` (uuid) - referência para training_styles

  2. Segurança
    - Manter RLS existente
    - Políticas já configuradas funcionarão com nova coluna
*/

-- Adicionar coluna style_id na tabela trainings se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainings' AND column_name = 'style_id'
  ) THEN
    ALTER TABLE trainings ADD COLUMN style_id uuid REFERENCES training_styles(id);
  END IF;
END $$;