/*
  # Adicionar coluna avatar_url à tabela profiles

  1. Alterações na Tabela
    - Adiciona coluna `avatar_url` (text, nullable) à tabela `profiles`
    - Permite armazenar URLs de avatars dos usuários

  2. Segurança
    - Mantém as políticas RLS existentes
    - A coluna é opcional (nullable) para compatibilidade
*/

-- Adicionar coluna avatar_url à tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;