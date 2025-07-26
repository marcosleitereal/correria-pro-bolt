/*
  # Adicionar constraint única para user_id na tabela subscriptions

  1. Alterações na Tabela
    - Adicionar constraint UNIQUE na coluna `user_id` da tabela `subscriptions`
    - Isso permitirá operações de upsert usando ON CONFLICT(user_id)

  2. Segurança
    - Manter todas as políticas RLS existentes
    - Garantir que cada usuário pode ter apenas uma assinatura

  3. Observações
    - Esta constraint é necessária para operações de upsert funcionarem corretamente
    - Evita duplicação de assinaturas para o mesmo usuário
*/

-- Primeiro, remover qualquer duplicata existente (manter apenas a mais recente)
DELETE FROM subscriptions 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM subscriptions 
  ORDER BY user_id, created_at DESC
);

-- Adicionar constraint única na coluna user_id
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);