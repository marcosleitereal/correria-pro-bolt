/*
  # Correção do sistema de gerenciamento de treinadores para administradores

  1. Políticas RLS
    - Permite que administradores vejam todos os perfis
    - Permite que administradores vejam todas as assinaturas
    - Mantém segurança para usuários normais

  2. View otimizada
    - Corrige a view user_subscription_details
    - Inclui todos os dados necessários para o painel admin
    - Performance otimizada com joins corretos
*/

-- Política para administradores verem todos os perfis
CREATE POLICY "Admins podem visualizar todos os perfis"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.email = 'dev@sonnik.com.br'
    )
  );

-- Política para administradores verem todas as assinaturas
CREATE POLICY "Admins podem visualizar todas as assinaturas"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.email = 'dev@sonnik.com.br'
    )
  );

-- Recriar a view user_subscription_details com dados corretos
DROP VIEW IF EXISTS user_subscription_details;

CREATE VIEW user_subscription_details AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.role,
  COALESCE(s.status, 'no_subscription') as subscription_status,
  COALESCE(pl.name, 'Nenhum plano') as current_plan_name,
  s.plan_id,
  s.trial_ends_at,
  s.current_period_end,
  CASE 
    WHEN s.status = 'trialing' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > NOW()) THEN true
    WHEN s.status = 'active' THEN true
    ELSE false
  END as has_access
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE p.role = 'coach'
ORDER BY p.full_name;

-- Garantir que a view seja acessível por administradores
GRANT SELECT ON user_subscription_details TO authenticated;