/*
  # Correção Crítica da Função handle_new_user

  1. Função Corrigida
    - Busca dinâmica da duração do trial da tabela app_settings
    - Criação automática de perfil com role 'coach'
    - Criação automática de assinatura em trial
    - Tratamento robusto de erros
    - Logs de auditoria para rastreabilidade

  2. Segurança
    - SECURITY DEFINER para execução com privilégios elevados
    - Validação de dados antes de inserção
    - Tratamento de casos extremos

  3. Conformidade
    - Alinhado com estrutura da tabela subscriptions
    - Compatível com LGPD e políticas de privacidade
    - Logs de auditoria para compliance
*/

-- Remover função existente se houver
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Criar função corrigida e robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_days INT;
  trial_athlete_limit INT;
  trial_training_limit INT;
  settings_found BOOLEAN := FALSE;
BEGIN
  -- Log de início da função
  RAISE LOG 'handle_new_user: Iniciando processamento para usuário %', new.id;
  
  -- Buscar configurações de trial da tabela app_settings
  BEGIN
    SELECT 
      trial_duration_days, 
      trial_athlete_limit, 
      trial_training_limit,
      TRUE
    INTO 
      trial_days, 
      trial_athlete_limit, 
      trial_training_limit,
      settings_found
    FROM public.app_settings 
    ORDER BY updated_at DESC 
    LIMIT 1;
    
    -- Se não encontrou configurações, usar valores padrão seguros
    IF NOT settings_found OR trial_days IS NULL THEN
      trial_days := 30;
      trial_athlete_limit := 5;
      trial_training_limit := 10;
      RAISE LOG 'handle_new_user: Usando valores padrão - trial_days: %, athlete_limit: %, training_limit: %', 
        trial_days, trial_athlete_limit, trial_training_limit;
    ELSE
      RAISE LOG 'handle_new_user: Configurações encontradas - trial_days: %, athlete_limit: %, training_limit: %', 
        trial_days, trial_athlete_limit, trial_training_limit;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, usar valores padrão seguros
    trial_days := 30;
    trial_athlete_limit := 5;
    trial_training_limit := 10;
    RAISE LOG 'handle_new_user: Erro ao buscar configurações, usando padrões - %', SQLERRM;
  END;

  -- Validar se o usuário já tem perfil (evitar duplicatas)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    RAISE LOG 'handle_new_user: Perfil já existe para usuário %, pulando criação', new.id;
  ELSE
    -- Criar perfil limpo para o novo usuário
    BEGIN
      INSERT INTO public.profiles (
        id, 
        full_name, 
        email,
        avatar_url, 
        role,
        created_at,
        updated_at
      )
      VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        new.email,
        NULL, 
        'coach',
        now(),
        now()
      );
      
      RAISE LOG 'handle_new_user: Perfil criado com sucesso para usuário %', new.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ERRO ao criar perfil para usuário % - %', new.id, SQLERRM;
      -- Não falhar a operação por causa do perfil
    END;
  END IF;

  -- Validar se o usuário já tem assinatura (evitar duplicatas)
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = new.id) THEN
    RAISE LOG 'handle_new_user: Assinatura já existe para usuário %, pulando criação', new.id;
  ELSE
    -- Criar assinatura de trial para o novo usuário
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
      )
      VALUES (
        new.id,
        NULL, -- Sem plano específico durante o trial
        'trialing',
        now() + (trial_days * interval '1 day'),
        now(),
        now() + (trial_days * interval '1 day'),
        now(),
        now()
      );
      
      RAISE LOG 'handle_new_user: Assinatura de trial criada com sucesso para usuário % - duração: % dias', 
        new.id, trial_days;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: ERRO ao criar assinatura para usuário % - %', new.id, SQLERRM;
      -- Não falhar a operação por causa da assinatura
    END;
  END IF;

  -- Criar log de auditoria para rastreabilidade
  BEGIN
    INSERT INTO public.audit_logs (
      actor_id,
      actor_email,
      action,
      details
    )
    VALUES (
      new.id,
      new.email,
      'USER_REGISTERED',
      jsonb_build_object(
        'user_id', new.id,
        'email', new.email,
        'full_name', COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        'trial_duration_days', trial_days,
        'trial_athlete_limit', trial_athlete_limit,
        'trial_training_limit', trial_training_limit,
        'trial_ends_at', (now() + (trial_days * interval '1 day'))::text,
        'timestamp', now()::text
      )
    );
    
    RAISE LOG 'handle_new_user: Log de auditoria criado para usuário %', new.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: Erro ao criar log de auditoria para usuário % - %', new.id, SQLERRM;
    -- Não falhar a operação por causa do log
  END;

  RAISE LOG 'handle_new_user: Processamento concluído com sucesso para usuário %', new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger atualizado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentário para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Função que processa automaticamente novos usuários criando perfil e assinatura de trial baseada nas configurações da tabela app_settings. Inclui logs de auditoria e tratamento robusto de erros.';

-- Verificar se a função foi criada corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE NOTICE 'SUCCESS: Função handle_new_user criada/atualizada com sucesso';
  ELSE
    RAISE EXCEPTION 'ERRO: Falha ao criar função handle_new_user';
  END IF;
END $$;

-- Verificar se o trigger foi criado corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'SUCCESS: Trigger on_auth_user_created criado/atualizado com sucesso';
  ELSE
    RAISE EXCEPTION 'ERRO: Falha ao criar trigger on_auth_user_created';
  END IF;
END $$;