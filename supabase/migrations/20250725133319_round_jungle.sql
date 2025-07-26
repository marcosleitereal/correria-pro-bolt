/*
  # Corrigir role de administrador para usuário dev

  1. Problema Identificado
    - O usuário dev@sonnik.com.br não possui role 'admin' na tabela profiles
    - A função Edge update-user-role verifica o role no banco, não no cliente
    
  2. Solução
    - Atualizar o role do usuário dev para 'admin' na tabela profiles
    - Garantir que o campo role existe e está configurado corretamente
    
  3. Segurança
    - Operação segura que apenas define o role correto para o usuário dev
*/

-- Primeiro, verificar se a coluna 'role' existe na tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'coach';
  END IF;
END $$;

-- Atualizar o role do usuário dev para admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'dev@sonnik.com.br';

-- Se o usuário dev não existir na tabela profiles, inserir com role admin
INSERT INTO profiles (id, full_name, email, role, created_at, updated_at)
SELECT 
  auth.uid(),
  'Desenvolvedor Admin',
  'dev@sonnik.com.br',
  'admin',
  now(),
  now()
FROM auth.users 
WHERE email = 'dev@sonnik.com.br'
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'dev@sonnik.com.br'
);