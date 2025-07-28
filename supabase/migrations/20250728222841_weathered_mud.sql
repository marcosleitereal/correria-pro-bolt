/*
  # Criar plano especial para administradores

  1. Novo Plano
    - `Elite Admin` (plano especial gratuito)
    - `price_monthly` = 0 (gratuito)
    - `max_athletes` = -1 (ilimitado)
    - `is_active` = true
    - `is_popular` = false
    - Recursos premium incluídos

  2. Características
    - Apenas administradores podem atribuir
    - Sem cobrança
    - Acesso total à plataforma
    - Recursos exclusivos
*/

INSERT INTO plans (
  id,
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
  is_popular,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Elite Admin',
  'Plano especial com acesso total e recursos exclusivos. Disponível apenas para administradores atribuírem a treinadores selecionados.',
  0.00, -- Gratuito
  0.00, -- Gratuito anual também
  -1, -- Atletas ilimitados
  -1, -- Treinos ilimitados
  '["Atletas ilimitados", "Treinos ilimitados com IA", "Analytics avançados premium", "Suporte prioritário 24/7", "API completa para integrações", "Recursos beta antecipados", "Consultoria especializada", "Backup dedicado", "Personalização completa da IA", "Relatórios executivos", "Acesso a novos recursos primeiro"]'::jsonb,
  null, -- Sem Stripe (gratuito)
  null, -- Sem Stripe anual
  null, -- Sem Mercado Pago
  true, -- Ativo
  false, -- Não é popular (não aparece destacado)
  now(),
  now()
);