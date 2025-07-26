/*
  # Correção Cirúrgica Crítica - Função handle_new_user com Duração Dinâmica

  ## PROBLEMA CRÍTICO IDENTIFICADO:
  A função handle_new_user estava usando duração hardcoded (30 dias) ignorando 
  completamente as configurações dinâmicas do Admin Panel (ex: 22 dias configurados).

  ## CORREÇÃO IMPLEMENTADA:
  1. Busca dinâmica obrigatória em app_settings
  2. Uso da duração REAL configurada pelo administrador
  3. Fallback seguro apenas se tabela vazia
  4. Logs de auditoria detalhados para rastreabilidade

  ## RESULTADO:
  Novos usuários receberão exatamente a duração configurada no Admin Panel.
*/

-- ETAPA 1: Recriar a função handle_new_user com lógica dinâmica
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  trial_days INT;
  trial_athlete_limit INT;
  trial_training_limit INT;
  calculated_end_date TIMESTAMPTZ;
  settings_found BOOLEAN := FALSE;
  audit_details JSONB;
BEGIN
  -- CORREÇÃO CRÍTICA: Buscar configurações DINÂMICAS do Admin Panel
  RAISE LOG 'CORREÇÃO CRÍTICA: Iniciando handle_new_user para usuário %', NEW.id;
  RAISE LOG 'CORREÇÃO CRÍTICA: Buscando configurações dinâmicas em app_settings...';
  
  -- Buscar as configurações mais recentes do Admin Panel
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
  IF FOUND AND trial_days IS NOT NULL THEN
    settings_found := TRUE;
    RAISE LOG 'CORREÇÃO CRÍTICA: Configurações dinâmicas encontradas - trial_duration_days: % dias', trial_days;
    RAISE LOG 'CORREÇÃO CRÍTICA: Configurações completas - atletas: %, treinos: %', trial_athlete_limit, trial_training_limit;
  ELSE
    -- FALLBACK SEGURO: Apenas se tabela app_settings estiver vazia
    trial_days := 30;
    trial_athlete_limit := 5;
    trial_training_limit := 10;
    settings_found := FALSE;
    RAISE LOG 'CORREÇÃO CRÍTICA: FALLBACK aplicado - usando valores padrão (30 dias, 5 atletas, 10 treinos)';
  END IF;
  
  -- Calcular data de fim do trial usando duração DINÂMICA
  calculated_end_date := NOW() + (trial_days * INTERVAL '1 day');
  RAISE LOG 'CORREÇÃO CRÍTICA: Data de fim calculada: % (usando % dias)', calculated_end_date, trial_days;
  
  -- Verificar se perfil já existe (evitar duplicatas)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RAISE LOG 'CORREÇÃO CRÍTICA: Perfil já existe para usuário %, pulando criação', NEW.id;
  ELSE
    -- Criar perfil do usuário
    INSERT INTO public.profiles (
      id, 
      full_name, 
      email,
      avatar_url, 
      role
    ) VALUES (
      NEW.id, 
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NULL, 
      'coach'
    );
    RAISE LOG 'CORREÇÃO CRÍTICA: Perfil criado com sucesso para usuário %', NEW.id;
  END IF;
  
  -- Verificar se assinatura já existe (evitar duplicatas)
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id) THEN
    RAISE LOG 'CORREÇÃO CRÍTICA: Assinatura já existe para usuário %, pulando criação', NEW.id;
  ELSE
    -- Criar assinatura de trial usando duração DINÂMICA do Admin Panel
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
      calculated_end_date, -- USA DURAÇÃO DINÂMICA!
      NOW(),
      calculated_end_date
    );
    RAISE LOG 'CORREÇÃO CRÍTICA: Assinatura de trial criada - fim em % (% dias)', calculated_end_date, trial_days;
  END IF;
  
  -- Preparar detalhes para auditoria
  audit_details := jsonb_build_object(
    'user_id', NEW.id,
    'user_email', NEW.email,
    'user_name', NEW.raw_user_meta_data->>'full_name',
    'settings_source', CASE WHEN settings_found THEN 'app_settings_dynamic' ELSE 'fallback_default' END,
    'trial_duration_days', trial_days,
    'trial_athlete_limit', trial_athlete_limit,
    'trial_training_limit', trial_training_limit,
    'trial_ends_at', calculated_end_date,
    'created_at', NOW(),
    'correction_applied', 'dynamic_duration_from_admin_panel'
  );
  
  -- Criar log de auditoria
  BEGIN
    INSERT INTO public.audit_logs (
      actor_id,
      actor_email,
      action,
      details
    ) VALUES (
      NEW.id,
      NEW.email,
      'USER_CREATED_WITH_DYNAMIC_TRIAL',
      audit_details
    );
    RAISE LOG 'CORREÇÃO CRÍTICA: Log de auditoria criado com detalhes completos';
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'CORREÇÃO CRÍTICA: Erro ao criar log de auditoria (não crítico): %', SQLERRM;
  END;
  
  RAISE LOG 'CORREÇÃO CRÍTICA: handle_new_user concluído com SUCESSO para usuário % - trial de % dias aplicado', NEW.id, trial_days;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'CORREÇÃO CRÍTICA: ERRO na função handle_new_user: %', SQLERRM;
  -- Mesmo com erro, retornar NEW para não bloquear criação do usuário
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ETAPA 2: Recriar o trigger para garantir que está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ETAPA 3: Comentário de documentação
COMMENT ON FUNCTION public.handle_new_user() IS 
'Função que processa automaticamente novos usuários criando perfil e assinatura de trial baseada nas configurações DINÂMICAS da tabela app_settings. Inclui logs de auditoria e tratamento robusto de erros. CORREÇÃO CRÍTICA: Agora usa duração dinâmica em vez de valores hardcoded.';

-- ETAPA 4: Log de confirmação da correção
DO $$
BEGIN
  RAISE LOG '🔧 CORREÇÃO CRÍTICA APLICADA: handle_new_user agora usa duração dinâmica do Admin Panel';
  RAISE LOG '✅ RESULTADO: Novos usuários receberão exatamente a duração configurada pelo administrador';
  RAISE LOG '📊 RASTREABILIDADE: Logs de auditoria incluem fonte das configurações (dinâmica vs fallback)';
END $$;