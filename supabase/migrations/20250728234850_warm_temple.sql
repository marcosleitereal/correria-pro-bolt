/*
  # Criar Sistema de Plano Restrito

  1. Novo Plano
    - `Restrito` - Plano de bloqueio para trials expirados
    - Preço R$ 0,00 (gratuito mas bloqueado)
    - 0 atletas, 0 treinos permitidos
    - Não listado publicamente

  2. Segurança
    - Apenas administradores podem atribuir
    - Sistema pode mover automaticamente trials expirados
*/

-- Criar plano restrito se não existir
INSERT INTO plans (
  name,
  description,
  price_monthly,
  price_yearly,
  max_athletes,
  max_trainings_per_month,
  features,
  stripe_price_id_monthly,
  stripe_price_id_yearly,
  mercadopago_plan_id,
  is_active,
  is_popular
) VALUES (
  'Restrito',
  'Plano de acesso restrito para contas com trial expirado. Upgrade necessário para continuar usando a plataforma.',
  0.00,
  NULL,
  0,
  0,
  '["Acesso bloqueado", "Upgrade necessário", "Suporte limitado"]'::jsonb,
  NULL,
  NULL,
  NULL,
  true,
  false
) ON CONFLICT (name) DO NOTHING;

-- Verificar se o plano foi criado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Restrito') THEN
    RAISE EXCEPTION 'Falha ao criar plano Restrito';
  END IF;
  
  RAISE NOTICE 'Plano Restrito criado/verificado com sucesso';
END $$;