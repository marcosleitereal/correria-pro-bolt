/*
  # Correção de Constraints para ON CONFLICT

  Este arquivo corrige os constraints ausentes que causam o erro "there is no unique or exclusion constraint matching the ON CONFLICT specification".
  
  ## Problemas Identificados:
  1. `subscriptions.user_id` - usado em ON CONFLICT mas sem constraint UNIQUE
  2. `ai_settings.setting_name` - usado em ON CONFLICT mas sem constraint UNIQUE  
  3. `admin_settings.setting_key` - usado em ON CONFLICT mas sem constraint UNIQUE
  4. `payment_gateways.gateway_name` - usado em ON CONFLICT mas sem constraint UNIQUE
  5. `profiles.id` - usado em ON CONFLICT mas precisa verificar se tem constraint

  ## Solução:
  Adicionar constraints UNIQUE nas colunas necessárias sem afetar dados existentes.
*/

-- 1. Adicionar constraint UNIQUE em subscriptions.user_id
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscriptions_user_id_unique' 
    AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 2. Adicionar constraint UNIQUE em ai_settings.setting_name
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ai_settings_setting_name_unique' 
    AND table_name = 'ai_settings'
  ) THEN
    ALTER TABLE ai_settings ADD CONSTRAINT ai_settings_setting_name_unique UNIQUE (setting_name);
  END IF;
END $$;

-- 3. Adicionar constraint UNIQUE em admin_settings.setting_key
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admin_settings_setting_key_unique' 
    AND table_name = 'admin_settings'
  ) THEN
    ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_setting_key_unique UNIQUE (setting_key);
  END IF;
END $$;

-- 4. Adicionar constraint UNIQUE em payment_gateways.gateway_name
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payment_gateways_gateway_name_unique' 
    AND table_name = 'payment_gateways'
  ) THEN
    ALTER TABLE payment_gateways ADD CONSTRAINT payment_gateways_gateway_name_unique UNIQUE (gateway_name);
  END IF;
END $$;

-- 5. Verificar e garantir que profiles.id tem constraint (deve ser PRIMARY KEY)
-- Não deveria ser necessário, mas vamos verificar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'PRIMARY KEY'
    AND table_name = 'profiles'
    AND constraint_name = 'profiles_pkey'
  ) THEN
    -- Se por algum motivo não existir, criar
    ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- 6. Adicionar constraint UNIQUE em app_settings.id (se necessário)
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'PRIMARY KEY'
    AND table_name = 'app_settings'
    AND constraint_name = 'app_settings_pkey'
  ) THEN
    -- Se por algum motivo não existir, criar
    ALTER TABLE app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- 7. Adicionar constraint UNIQUE em stripe_customers.user_id
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stripe_customers_user_id_unique' 
    AND table_name = 'stripe_customers'
  ) THEN
    ALTER TABLE stripe_customers ADD CONSTRAINT stripe_customers_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 8. Adicionar constraint UNIQUE em stripe_subscriptions.customer_id
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stripe_subscriptions_customer_id_unique' 
    AND table_name = 'stripe_subscriptions'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD CONSTRAINT stripe_subscriptions_customer_id_unique UNIQUE (customer_id);
  END IF;
END $$;

-- 9. Adicionar constraint UNIQUE em favorite_styles (user_id, style_id)
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'favorite_styles_user_style_unique' 
    AND table_name = 'favorite_styles'
  ) THEN
    ALTER TABLE favorite_styles ADD CONSTRAINT favorite_styles_user_style_unique UNIQUE (user_id, style_id);
  END IF;
END $$;

-- 10. Adicionar constraint UNIQUE em runner_group_memberships (runner_id, group_id)
-- Verificar se já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'runner_group_memberships_runner_group_unique' 
    AND table_name = 'runner_group_memberships'
  ) THEN
    ALTER TABLE runner_group_memberships ADD CONSTRAINT runner_group_memberships_runner_group_unique UNIQUE (runner_id, group_id);
  END IF;
END $$;