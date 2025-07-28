import { useState, useEffect } from 'react';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { useRunners } from './useRunners';
import { useAppSettings } from './useAppSettings';

interface SubscriptionGuard {
  canCreateRunner: boolean;
  canGenerateTraining: boolean;
  canAccessFeature: boolean;
  trialExpired: boolean;
  athleteLimitReached: boolean;
  currentAthleteCount: number;
  athleteLimit: number;
  blockingReason: string | null;
}

export const useSubscriptionGuard = () => {
  const { subscriptionStatus, isTrialing, isActive, hasAccess, daysUntilTrialEnd } = useSubscriptionStatus();
  const { runners } = useRunners();
  const { settings: appSettings, loading: settingsLoading } = useAppSettings();
  
  const [guard, setGuard] = useState<SubscriptionGuard>({
    canCreateRunner: false,
    canGenerateTraining: false,
    canAccessFeature: false,
    trialExpired: false,
    athleteLimitReached: false,
    currentAthleteCount: 0,
    athleteLimit: 0,
    blockingReason: null,
  });

  useEffect(() => {
    // AGUARDAR configurações carregarem antes de calcular
    if (settingsLoading) {
      console.log('🛡️ GUARD DEBUG: Aguardando configurações do Painel Admin carregarem...');
      return;
    }

    if (!appSettings) {
      console.error('❌ GUARD DEBUG: Configurações do Painel Admin não encontradas!');
      console.error('❌ Isso significa que a tabela app_settings está vazia ou não foi configurada');
      return;
    }

    console.log('🛡️ GUARD DEBUG: Configurações do Painel Admin carregadas:', {
      trial_duration_days: appSettings.trial_duration_days,
      trial_athlete_limit: appSettings.trial_athlete_limit,
      trial_training_limit: appSettings.trial_training_limit,
      fonte: 'app_settings via useAppSettings hook'
    });

    calculateGuardStatus();
  }, [subscriptionStatus, runners, appSettings, settingsLoading]);

  const calculateGuardStatus = () => {
    const currentAthleteCount = runners.filter(r => !r.is_archived).length;
    
    console.log('🛡️ GUARD DEBUG: Calculando status de acesso:', {
      userEmail: subscriptionStatus?.email,
      isTrialing,
      daysUntilTrialEnd,
      hasAccess,
      isActive,
      subscription_status: subscriptionStatus?.subscription_status,
      current_plan_name: subscriptionStatus?.current_plan_name
    });

    // ACESSO TOTAL PARA DEV
    if (subscriptionStatus?.email === 'dev@sonnik.com.br') {
      console.log('👑 GUARD DEBUG: Usuário dev - acesso total liberado');
      setGuard({
        canCreateRunner: true,
        canGenerateTraining: true,
        canAccessFeature: true,
        trialExpired: false,
        athleteLimitReached: false,
        currentAthleteCount,
        athleteLimit: Infinity,
        blockingReason: null,
      });
      return;
    }

    // VERIFICAR SE ESTÁ NO PLANO RESTRITO
    const isRestrictedPlan = subscriptionStatus?.current_plan_name === 'Restrito';
    
    if (isRestrictedPlan) {
      console.log('🚫 GUARD DEBUG: Usuário no plano RESTRITO - acesso bloqueado');
      setGuard({
        canCreateRunner: false,
        canGenerateTraining: false,
        canAccessFeature: false,
        trialExpired: false,
        athleteLimitReached: false,
        currentAthleteCount,
        athleteLimit: 0,
        blockingReason: 'Sua conta está em modo restrito. Entre em contato com o suporte ou faça upgrade para um plano pago para continuar usando a plataforma.',
      });
      return;
    }

    // VERIFICAR SE ESTÁ EM TRIAL VÁLIDO
    const isValidTrial = isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd > 0;
    
    console.log('🎯 GUARD DEBUG: Verificação de trial válido:', {
      isTrialing,
      daysUntilTrialEnd,
      isValidTrial,
      hasAccess
    });
    
    // LIBERAR ACESSO PARA TRIAL VÁLIDO OU ASSINATURA ATIVA
    if (isValidTrial || isActive || hasAccess) {
      console.log('✅ GUARD DEBUG: Acesso liberado:', {
        isValidTrial,
        isActive,
        hasAccess,
        reason: isValidTrial ? 'Trial válido' : isActive ? 'Assinatura ativa' : 'Has access true',
        trialSettings: {
          trial_duration_days: appSettings?.trial_duration_days,
          trial_athlete_limit: appSettings?.trial_athlete_limit,
          trial_training_limit: appSettings?.trial_training_limit
        }
      });
      
      // CRÍTICO: USAR SEMPRE as configurações do Painel Admin para trial
      const athleteLimit = isValidTrial && appSettings ? appSettings.trial_athlete_limit : Infinity;
      
      console.log('🎯 GUARD: Limite de atletas aplicado (VALORES DO PAINEL ADMIN):', {
        athleteLimit,
        isValidTrial,
        configSource: 'Painel Admin app_settings',
        configValues: appSettings ? {
          duration: appSettings.trial_duration_days,
          athletes: appSettings.trial_athlete_limit,
          trainings: appSettings.trial_training_limit
        } : 'Configurações não carregadas'
      });
      
      setGuard({
        canCreateRunner: true,
        canGenerateTraining: true,
        canAccessFeature: true,
        trialExpired: false,
        athleteLimitReached: false,
        currentAthleteCount,
        athleteLimit,
        blockingReason: null,
      });
      return;
    }
    
    console.log('❌ GUARD DEBUG: Acesso negado - verificando motivos...');
    
    // VERIFICAR SE TRIAL EXPIROU
    const trialExpired = isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd <= 0;
    
    console.log('🕐 GUARD DEBUG: Trial expirado?', {
      trialExpired,
      isTrialing,
      daysUntilTrialEnd
    });
    
    // DETERMINAR MOTIVO DO BLOQUEIO
    let blockingReason: string | null = null;
    
    if (trialExpired) {
      blockingReason = 'Seu período de teste expirou. Faça upgrade para um plano pago para continuar usando a plataforma.';
    } else if (!hasAccess && !isTrialing && !isActive) {
      blockingReason = 'Você não possui acesso ativo à plataforma. Verifique sua assinatura.';
    } else {
      blockingReason = 'Status de acesso não reconhecido. Entre em contato com o suporte.';
    }

    console.log('🎯 GUARD DEBUG: Status final do guard:', {
      canAccessFeature: false,
      canCreateRunner: false,
      canGenerateTraining: false,
      trialExpired,
      blockingReason
    });

    setGuard({
      canCreateRunner: false,
      canGenerateTraining: false,
      canAccessFeature: false,
      trialExpired,
      athleteLimitReached: false,
      currentAthleteCount,
      athleteLimit: 0,
      blockingReason,
    });
  };

  const showUpgradeModal = () => {
    window.location.href = '/pricing';
  };

  const getAthleteCountDisplay = () => {
    if (guard.athleteLimit === Infinity) {
      return `${guard.currentAthleteCount} atletas ativos`;
    }
    return `${guard.currentAthleteCount}/${guard.athleteLimit} atletas`;
  };

  return {
    ...guard,
    showUpgradeModal,
    getAthleteCountDisplay,
  };
};