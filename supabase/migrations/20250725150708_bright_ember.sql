/*
  # Corrigir recursão infinita nas políticas RLS da tabela profiles

  1. Problema identificado
    - Políticas RLS fazendo referência circular à tabela profiles
    - Causando recursão infinita durante avaliação das políticas

  2. Solução
    - Remover todas as políticas problemáticas
    - Recriar políticas simples sem referências circulares
    - Usar apenas auth.uid() para verificações de acesso

  3. Segurança
    - Manter proteção adequada para dados dos usuários
    - Permitir acesso administrativo sem recursão
*/

-- Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins podem visualizar todos os perfis" ON profiles;

-- Recriar políticas simples sem recursão
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Política administrativa simples usando apenas email direto
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'dev@sonnik.com.br'
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'dev@sonnik.com.br'
  );

CREATE POLICY "Admins can delete all profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'dev@sonnik.com.br'
  );