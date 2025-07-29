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
    console.log('🛡️ GUARD DEBUG: Recalculando guard com dados:', {
      subscriptionStatus: subscriptionStatus?.current_plan_name,
      hasAccess,
      isTrialing,
      isActive,
      userEmail: subscriptionStatus?.email
    });

    calculateGuardStatus();
  }, [subscriptionStatus, runners, appSettings, settingsLoading, hasAccess, isTrialing, isActive]);

  const calculateGuardStatus = () => {
    const currentAthleteCount = runners.filter(r => !r.is_archived).length;
    
    console.log('🛡️ GUARD DEBUG: Iniciando cálculo de status:', {
      userEmail: subscriptionStatus?.email,
      current_plan_name: subscriptionStatus?.current_plan_name,
      hasAccess,
      isTrialing,
      isActive
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

    // VERIFICAÇÃO CRÍTICA: PLANO RESTRITO - BLOQUEIO TOTAL
    const isRestrictedPlan = subscriptionStatus?.current_plan_name === 'Restrito' || 
                            subscriptionStatus?.current_plan_name === 'restrito' ||
                            subscriptionStatus?.current_plan_name?.toLowerCase().includes('restrito');
    
    console.log('🚫 GUARD DEBUG: Verificação de plano restrito:', {
      current_plan_name: subscriptionStatus?.current_plan_name,
      isRestrictedPlan,
      hasAccess
    });
    
    if (isRestrictedPlan) {
      console.log('🚫 GUARD DEBUG: PLANO RESTRITO DETECTADO - BLOQUEIO TOTAL APLICADO');
      setGuard({
        canCreateRunner: false,
        canGenerateTraining: false,
        canAccessFeature: false,
        trialExpired: false,
        athleteLimitReached: false,
        currentAthleteCount,
        athleteLimit: 0,
        blockingReason: 'Sua conta está BLOQUEADA no plano restrito. Você pode navegar mas não pode usar as funcionalidades. Faça upgrade para um plano pago para reativar todas as funcionalidades.',
      });
      return;
    }

    // VERIFICAÇÃO DE ACESSO GERAL
    if (!hasAccess) {
      console.log('❌ GUARD DEBUG: Sem acesso - verificando motivos...');
      
      const trialExpired = isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd <= 0;
      
      let blockingReason: string | null = null;
      
      if (trialExpired) {
        blockingReason = 'Seu período de teste expirou. Faça upgrade para um plano pago para continuar usando a plataforma.';
      } else {
        blockingReason = 'Você não possui acesso ativo à plataforma. Verifique sua assinatura ou faça upgrade.';
      }

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
      return;
    }

    // ACESSO LIBERADO (TRIAL VÁLIDO OU ASSINATURA ATIVA)
    console.log('✅ GUARD DEBUG: Acesso liberado');
    
    const athleteLimit = isTrialing && appSettings ? appSettings.trial_athlete_limit : Infinity;
    
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

  console.log('🛡️ GUARD DEBUG: Estado final do guard:', {
    canAccessFeature: guard.canAccessFeature,
    canCreateRunner: guard.canCreateRunner,
    canGenerateTraining: guard.canGenerateTraining,
    blockingReason: guard.blockingReason
  });

  return {
    ...guard,
    showUpgradeModal,
    getAthleteCountDisplay,
  };
};