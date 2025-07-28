/*
  # Correção Crítica: Sistema de Trial e Subscription Guard

  1. Função de Trigger Corrigida
    - Corrige a criação automática de trial para novos usuários
    - Lê configurações de trial da tabela app_settings
    - Cria perfil e assinatura de trial automaticamente

  2. Segurança
    - Validações robustas para evitar duplicatas
    - Tratamento de erros adequado
    - Logs para debugging
*/

-- Primeiro, vamos recriar a função handle_new_user com lógica corrigida
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_duration INTEGER := 30; -- Default fallback
  trial_end_date TIMESTAMPTZ;
BEGIN
  -- Log do início da função
  RAISE LOG 'handle_new_user: Processando novo usuário ID: %', NEW.id;
  
  -- Buscar configurações de trial da tabela app_settings
  BEGIN
    SELECT trial_duration_days INTO trial_duration
    FROM app_settings
    LIMIT 1;
    
    -- Se não encontrou configurações, usar default
    IF trial_duration IS NULL THEN
      trial_duration := 30;
      RAISE LOG 'handle_new_user: Usando duração padrão de trial: % dias', trial_duration;
    ELSE
      RAISE LOG 'handle_new_user: Duração de trial configurada: % dias', trial_duration;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    trial_duration := 30;
    RAISE LOG 'handle_new_user: Erro ao buscar configurações, usando default: % dias', trial_duration;
  END;
  
  -- Calcular data de fim do trial
  trial_end_date := NOW() + (trial_duration || ' days')::INTERVAL;
  RAISE LOG 'handle_new_user: Trial terminará em: %', trial_end_date;
  
  -- Criar perfil do usuário (se não existir)
  BEGIN
    INSERT INTO public.profiles (
      id,
      full_name,
      email,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
      NEW.email,
      'coach',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'handle_new_user: Perfil criado/verificado para usuário: %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Erro ao criar perfil: %', SQLERRM;
  END;
  
  -- Criar assinatura de trial (CRÍTICO - Esta é a correção principal)
  BEGIN
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NULL, -- Sem plano durante trial
      'trialing',
      trial_end_date,
      NOW(),
      trial_end_date,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'handle_new_user: Assinatura de trial criada para usuário: %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Erro ao criar assinatura de trial: %', SQLERRM;
  END;
  
  RAISE LOG 'handle_new_user: Processamento concluído para usuário: %', NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger para garantir que está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verificar se a tabela app_settings tem dados padrão
INSERT INTO app_settings (
  trial_duration_days,
  trial_athlete_limit,
  trial_training_limit,
  updated_at
) VALUES (
  30,
  5,
  10,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

RAISE LOG 'fix_trial_activation: Correções aplicadas com sucesso';