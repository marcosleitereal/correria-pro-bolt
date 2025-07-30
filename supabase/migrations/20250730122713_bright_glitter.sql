/*
  # Create Restricted Plan

  1. New Tables
    - Creates a restricted plan for expired trial users
  2. Security
    - Ensures only one restricted plan exists
  3. Changes
    - Adds restricted plan with 0 athletes and 0 trainings limit
*/

-- Check if restricted plan already exists
DO $$
BEGIN
  -- Only insert if the plan doesn't exist
  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Restrito') THEN
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
    );
    
    RAISE NOTICE 'Plano Restrito criado com sucesso';
  ELSE
    RAISE NOTICE 'Plano Restrito já existe, pulando criação';
  END IF;
END $$;

-- Verify the plan was created or already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Restrito') THEN
    RAISE EXCEPTION 'Falha ao criar ou encontrar plano Restrito';
  END IF;
  
  RAISE NOTICE 'Plano Restrito verificado com sucesso';
END $$;