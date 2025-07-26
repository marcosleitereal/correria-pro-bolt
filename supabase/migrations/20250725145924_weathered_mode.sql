/*
  # Criar view user_subscription_details

  1. Nova View
    - `user_subscription_details`
      - Combina dados de profiles e subscriptions
      - Inclui informações de planos
      - Calcula status de acesso
  
  2. Segurança
    - View herda políticas RLS das tabelas base
    - Acesso controlado por permissões existentes
*/

-- Primeiro, vamos verificar se existe uma tabela subscriptions
-- Se não existir, vamos criar uma estrutura básica
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política para admins verem todas as assinaturas
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

-- Criar a view user_subscription_details
CREATE OR REPLACE VIEW public.user_subscription_details AS
SELECT
    p.id AS user_id,
    p.full_name,
    p.email,
    p.role,
    COALESCE(s.status, 'no_subscription') AS subscription_status,
    COALESCE(pl.name, 'Nenhum Plano') AS current_plan_name,
    s.plan_id,
    s.trial_ends_at,
    s.current_period_end,
    CASE
        WHEN s.status = 'active' THEN TRUE
        WHEN s.status = 'trialing' AND (s.trial_ends_at IS NULL OR s.trial_ends_at > NOW()) THEN TRUE
        ELSE FALSE
    END AS has_access
FROM
    public.profiles p
LEFT JOIN
    public.subscriptions s ON p.id = s.user_id
LEFT JOIN
    public.plans pl ON s.plan_id = pl.id
WHERE
    p.role = 'coach';

-- Garantir que a view herda as políticas RLS
ALTER VIEW public.user_subscription_details SET (security_invoker = true);