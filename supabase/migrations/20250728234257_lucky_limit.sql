/*
  # Criar Plano Restrito para Bloqueio

  1. Novo Plano
    - `plans` table
      - Nome: "Restrito"
      - Preço: R$ 0,00 (gratuito mas restrito)
      - Máximo 0 atletas
      - Não listado publicamente
      - Apenas para admin

  2. Funcionalidades
    - Plano de bloqueio automático
    - Atribuição manual pelo admin
    - Transição automática após trial
*/

-- Inserir plano restrito
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
  'Plano de acesso restrito para usuários que não fizeram upgrade após o período de teste. Apenas administradores podem atribuir este plano.',
  0.00,
  NULL,
  0, -- Zero atletas permitidos
  0, -- Zero treinos permitidos
  '["Acesso apenas para visualização", "Sem criação de atletas", "Sem geração de treinos", "Histórico limitado", "Apenas leitura"]'::jsonb,
  NULL, -- Sem integração com Stripe
  NULL,
  NULL, -- Sem integração com Mercado Pago
  true,
  false
);