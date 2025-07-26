/*
  # Correção Cirúrgica da Função handle_new_user - Duração Dinâmica de Trial

  ## PROBLEMA CRÍTICO IDENTIFICADO:
  A função handle_new_user estava usando valores hardcoded ou desatualizados para a duração 
  do período de teste, ignorando completamente as configurações dinâmicas definidas pelo 
  administrador na tabela app_settings do Painel Admin.

  ## CORREÇÃO IMPLEMENTADA:
  1. Busca dinâmica da duração do trial na tabela app_settings
  2. Fallback seguro para 1 dia caso a tabela esteja vazia
  3. Cálculo correto do trial_ends_at usando a duração dinâmica
  4. Logs de auditoria aprimorados com valores reais utilizados
  5. Tratamento robusto de erros para cada operação

  ## IMPACTO:
  - ✅ Novos usuários receberão a duração de trial configurada no Admin Panel
  - ✅ Administradores podem alterar a duração e ela será aplicada imediatamente
  - ✅ Sistema de fallback garante que a função nunca falhe
  - ✅ Logs de auditoria permitem rastreamento completo
*/

-- Recriar a função handle_new_user com lógica dinâmica corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_days INT;
  trial_athlete_limit INT;
  trial_training_limit INT;
  settings_found BOOLEAN := FALSE;
  profile_exists BOOLEAN := FALSE;
  subscription_exists BOOLEAN := FALSE;
  audit_details JSONB;
BEGIN
  -- ETAPA 1: BUSCA DINÂMICA DAS CONFIGURAÇÕES DO ADMIN PANEL
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
      RAISE NOTICE 'HANDLE_NEW_USER: Configurações dinâmicas carregadas - Duração: % dias, Atletas: %, Treinos: %', 
        trial_days, trial_athlete_limit, trial_training_limit;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'HANDLE_NEW_USER: Erro ao buscar configurações dinâmicas: %', SQLERRM;
    settings_found := FALSE;
  END;

  -- ETAPA 2: FALLBACK SEGURO PARA VALORES PADRÃO
  IF NOT settings_found OR trial_days IS NULL THEN
    trial_days := 1; -- FALLBACK SEGURO: 1 dia mínimo
    trial_athlete_limit := 1; -- FALLBACK SEGURO: 1 atleta mínimo
    trial_training_limit := 1; -- FALLBACK SEGURO: 1 treino mínimo
    RAISE WARNING 'HANDLE_NEW_USER: Usando valores de fallback seguros - Duração: % dia, Atletas: %, Treinos: %', 
      trial_days, trial_athlete_limit, trial_training_limit;
  END IF;

  -- ETAPA 3: VERIFICAR SE PERFIL JÁ EXISTE (EVITAR DUPLICATAS)
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE id = NEW.id
    ) INTO profile_exists;
    
    IF profile_exists THEN
      RAISE NOTICE 'HANDLE_NEW_USER: Perfil já existe para usuário %, pulando criação', NEW.id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'HANDLE_NEW_USER: Erro ao verificar perfil existente: %', SQLERRM;
    profile_exists := FALSE;
  END;

  -- ETAPA 4: CRIAR PERFIL LIMPO (SE NÃO EXISTIR)
  IF NOT profile_exists THEN
    BEGIN
      INSERT INTO public.profiles (
        id, 
        full_name, 
        email,
        avatar_url, 
        role
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        NEW.email,
        NULL, -- Avatar sempre NULL para novos usuários
        'coach' -- Role padrão sempre coach
      );
      
      RAISE NOTICE 'HANDLE_NEW_USER: Perfil criado com sucesso para usuário % com role coach', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'HANDLE_NEW_USER: Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
      -- Não falhar a operação por causa do perfil
    END;
  END IF;

  -- ETAPA 5: VERIFICAR SE ASSINATURA JÁ EXISTE (EVITAR DUPLICATAS)
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id
    ) INTO subscription_exists;
    
    IF subscription_exists THEN
      RAISE NOTICE 'HANDLE_NEW_USER: Assinatura já existe para usuário %, pulando criação', NEW.id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'HANDLE_NEW_USER: Erro ao verificar assinatura existente: %', SQLERRM;
    subscription_exists := FALSE;
  END;

  -- ETAPA 6: CRIAR ASSINATURA DE TRIAL COM DURAÇÃO DINÂMICA (SE NÃO EXISTIR)
  IF NOT subscription_exists THEN
    BEGIN
      INSERT INTO public.subscriptions (
        user_id,
        plan_id,
        status,
        trial_ends_at,
        current_period_start,
        current_period_end
      ) VALUES (
        NEW.id,
        NULL, -- Sem plano específico durante trial
        'trialing',
        NOW() + (trial_days * INTERVAL '1 day'), -- DURAÇÃO DINÂMICA APLICADA AQUI!
        NOW(),
        NOW() + (trial_days * INTERVAL '1 day')
      );
      
      RAISE NOTICE 'HANDLE_NEW_USER: Assinatura de trial criada com sucesso para usuário % - Duração: % dias (termina em: %)', 
        NEW.id, trial_days, (NOW() + (trial_days * INTERVAL '1 day'));
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'HANDLE_NEW_USER: Erro ao criar assinatura de trial para usuário %: %', NEW.id, SQLERRM;
      -- Não falhar a operação por causa da assinatura
    END;
  END IF;

  -- ETAPA 7: CRIAR LOG DE AUDITORIA DETALHADO
  BEGIN
    -- Montar detalhes estruturados para auditoria
    audit_details := jsonb_build_object(
      'user_id', NEW.id,
      'user_email', NEW.email,
      'user_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'),
      'settings_source', CASE WHEN settings_found THEN 'app_settings_dynamic' ELSE 'fallback_safe' END,
      'trial_duration_days', trial_days,
      'trial_athlete_limit', trial_athlete_limit,
      'trial_training_limit', trial_training_limit,
      'trial_ends_at', (NOW() + (trial_days * INTERVAL '1 day')),
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
      'NEW_USER_PROCESSED',
      audit_details
    );
    
    RAISE NOTICE 'HANDLE_NEW_USER: Log de auditoria criado com sucesso para usuário %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'HANDLE_NEW_USER: Erro ao criar log de auditoria para usuário %: %', NEW.id, SQLERRM;
    -- Não falhar a operação por causa do log
  END;

  -- ETAPA 8: RETORNO OBRIGATÓRIO DO TRIGGER
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- FALLBACK FINAL: Se tudo falhar, pelo menos não quebrar o sistema
  RAISE WARNING 'HANDLE_NEW_USER: ERRO CRÍTICO na função para usuário %: %', NEW.id, SQLERRM;
  RETURN NEW; -- Sempre retornar NEW para não bloquear criação do usuário
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário final explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
'Função que processa automaticamente novos usuários criando perfil e assinatura de trial baseada nas configurações DINÂMICAS da tabela app_settings. Inclui logs de auditoria e tratamento robusto de erros. CORREÇÃO CRÍTICA: Agora usa duração dinâmica em vez de valores hardcoded.';