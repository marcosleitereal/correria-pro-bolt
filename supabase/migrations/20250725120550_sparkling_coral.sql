/*
  # Criar tabela de logs de auditoria

  1. Nova Tabela
    - `audit_logs`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `actor_id` (uuid, nullable)
      - `actor_email` (text)
      - `action` (text)
      - `details` (jsonb)

  2. Segurança
    - Enable RLS na tabela `audit_logs`
    - Apenas admins podem visualizar logs
    - Nenhuma operação de modificação permitida pelo cliente
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem visualizar logs de auditoria
CREATE POLICY "Apenas admins podem visualizar logs de auditoria"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

-- Nenhuma operação de modificação permitida pelo cliente
-- Os logs só podem ser inseridos via Edge Functions seguras

-- Índices para performance
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_email_idx ON audit_logs (actor_email);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action);