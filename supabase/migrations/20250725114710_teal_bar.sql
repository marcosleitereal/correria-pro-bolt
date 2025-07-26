/*
  # Adicionar coluna mercadopago_plan_id à tabela plans

  1. Alterações na Tabela
    - Adiciona coluna `mercadopago_plan_id` (text, nullable) à tabela `plans`
    - Permite armazenar IDs de planos do Mercado Pago junto com os do Stripe

  2. Notas
    - Coluna é nullable pois nem todos os planos precisam ter ID do Mercado Pago
    - Compatível com a estrutura existente de Stripe
*/

-- Adicionar coluna mercadopago_plan_id à tabela plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'mercadopago_plan_id'
  ) THEN
    ALTER TABLE plans ADD COLUMN mercadopago_plan_id text;
  END IF;
END $$;