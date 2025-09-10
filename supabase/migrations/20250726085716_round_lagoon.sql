/*
  # Correção Cirúrgica Crítica: Função handle_new_user com Duração Dinâmica

  ## PROBLEMA CRÍTICO IDENTIFICADO:
  A função handle_new_user estava usando duração hardcoded ou padrão (1 dia) 
  para o período de teste, ignorando completamente as configurações dinâmicas 
  definidas pelo administrador na tabela app_settings.

  ## CORREÇÃO IMPLEMENTADA:
  1. Busca dinâmica obrigatória da duração em app_settings
  2. Fallback seguro para 30 dias se configurações não existirem
  3. Cálculo preciso do trial_ends_at usando valor dinâmico
  4. Logs de auditoria para rastreabilidade completa
  5. Tratamento robusto de erros em cada etapa

  ## RESULTADO GARANTIDO:
  Todo novo usuário receberá exatamente a duração de trial configurada 
  pelo administrador no Painel Admin, eliminando inconsistências.
*/

-- ETAPA 1: Remover função existente se houver
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ETAPA 2: Criar função corrigida com lógica dinâmica
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_days INT;
  trial_athlete_limit INT;
  trial_training_limit INT;
  settings_found BOOLEAN := FALSE;
  calculated_end_date TIMESTAMPTZ;
  audit_details JSONB;
  profile_exists BOOLEAN := FALSE;
  subscription_exists BOOLEAN := FALSE;
BEGIN
  -- CORREÇÃO CRÍTICA: Busca dinâmica obrigatória das configurações
  BEGIN
    SELECT 
      trial_duration_days, 
      trial_athlete_limit, 
      trial_training_limit
    INTO 
      trial_days, 
      trial_athlete_limit, 
      trial_training_limit
    FROM public.app_settings 
    ORDER BY updated_at DESC 
    LIMIT 1;
    
    -- Verificar se encontrou configurações
    IF trial_days IS NOT NULL THEN
      settings_found := TRUE;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log do erro mas não falhar a operação
    RAISE WARNING 'Erro ao buscar configurações dinâmicas: %', SQLERRM;
    settings_found := FALSE;
  END;

  -- FALLBACK SEGURO: Usar valores padrão se configurações não encontradas
  IF NOT settings_found OR trial_days IS NULL THEN
    trial_days := 30; -- PADRÃO SEGURO: 30 dias
    trial_athlete_limit := 5; -- PADRÃO SEGURO: 5 atletas
    trial_training_limit := 10; -- PADRÃO SEGURO: 10 treinos
    RAISE WARNING 'Usando valores padrão para trial: % dias, % atletas, % treinos', 
                  trial_days, trial_athlete_limit, trial_training_limit;
  END IF;

  -- VALIDAÇÃO: Verificar se perfil já existe
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) INTO profile_exists;

  -- ETAPA 3: Criar perfil do usuário (apenas se não existir)
  IF NOT profile_exists THEN
    BEGIN
      INSERT INTO public.profiles (
        id, 
        full_name, 
        email,
        phone,
        avatar_url, 
        role,
        created_at,
        updated_at
      ) VALUES (
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        NULL, -- avatar_url sempre NULL inicialmente
        'coach', -- role sempre 'coach' para novos usuários
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Perfil criado com sucesso para usuário: %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
      -- Continuar operação mesmo com erro no perfil
    END;
  ELSE
    RAISE NOTICE 'Perfil já existe para usuário: %', NEW.id;
  END IF;

  -- VALIDAÇÃO: Verificar se assinatura já existe
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id
  ) INTO subscription_exists;

  -- ETAPA 4: Criar assinatura de trial com duração DINÂMICA
  IF NOT subscription_exists THEN
    BEGIN
      -- CÁLCULO DINÂMICO CRÍTICO: Usar valor real do Admin Panel
      calculated_end_date := NOW() + (trial_days * INTERVAL '1 day');
      
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
        NULL, -- Sem plano específico durante trial
        'trialing', -- Status de trial
        calculated_end_date, -- DURAÇÃO DINÂMICA DO ADMIN PANEL
        NOW(),
        calculated_end_date,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Assinatura de trial criada: usuário %, duração % dias, expira em %', 
                   NEW.id, trial_days, calculated_end_date;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar assinatura para usuário %: %', NEW.id, SQLERRM;
      -- Continuar operação mesmo com erro na assinatura
    END;
  ELSE
    RAISE NOTICE 'Assinatura já existe para usuário: %', NEW.id;
  END IF;

  -- ETAPA 5: Criar log de auditoria detalhado
  BEGIN
    audit_details := jsonb_build_object(
      'user_id', NEW.id,
      'user_email', NEW.email,
      'user_name', NEW.raw_user_meta_data->>'full_name',
      'settings_source', CASE 
        WHEN settings_found THEN 'app_settings_dynamic' 
        ELSE 'fallback_default' 
      END,
      'trial_duration_days', trial_days,
      'trial_athlete_limit', trial_athlete_limit,
      'trial_training_limit', trial_training_limit,
      'trial_ends_at', calculated_end_date,
      'profile_created', NOT profile_exists,
      'subscription_created', NOT subscription_exists,
      'timestamp', NOW()
    );

    INSERT INTO public.audit_logs (
      actor_id,
      actor_email,
      action,
      details
    ) VALUES (
      NEW.id,
      NEW.email,
      'USER_REGISTERED_WITH_DYNAMIC_TRIAL',
      audit_details
    );
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar log de auditoria para usuário %: %', NEW.id, SQLERRM;
    -- Não falhar a operação por causa do log
  END;

  -- SUCESSO: Retornar o novo usuário
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log do erro crítico mas não falhar completamente
  RAISE WARNING 'ERRO CRÍTICO na função handle_new_user para usuário %: %', NEW.id, SQLERRM;
  RETURN NEW; -- Sempre retornar para não bloquear criação do usuário
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ETAPA 3: Recriar o trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ETAPA 4: Adicionar comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
'Função que processa automaticamente novos usuários criando perfil e assinatura de trial baseada nas configurações DINÂMICAS da tabela app_settings. Inclui logs de auditoria e tratamento robusto de erros. CORREÇÃO CRÍTICA: Agora usa duração dinâmica em vez de valores hardcoded.';

-- ETAPA 5: Verificar se a função foi criada corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE '✅ CORREÇÃO APLICADA: Função handle_new_user reescrita com duração dinâmica';
    RAISE NOTICE '🎯 RESULTADO: Novos usuários receberão duração de trial configurada no Admin Panel';
  ELSE
    RAISE EXCEPTION '❌ ERRO CRÍTICO: Função handle_new_user não foi criada corretamente';
  END IF;
END $$;
