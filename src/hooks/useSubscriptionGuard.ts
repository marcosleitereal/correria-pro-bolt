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
  const { status, subscription_data, loading: statusLoading } = useSubscriptionStatus();
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
    // AGUARDAR tanto status quanto configurações carregarem antes de calcular
    if (statusLoading || settingsLoading) {
      console.log('🛡️ GUARD DEBUG: Aguardando dados carregarem...', { statusLoading, settingsLoading });
      return;
    }



    calculateGuardStatus();
  }, [status, subscription_data, runners, appSettings, statusLoading, settingsLoading]);

  const calculateGuardStatus = () => {
    const currentAthleteCount = runners.filter(r => !r.is_archived).length;
    
    console.log('🛡️ GUARD DEBUG: Calculando status de acesso:', {
      userEmail: subscription_data?.email,
      status,
      subscription_status: subscription_data?.subscription_status,
      has_access: subscription_data?.has_access
    });

    // ACESSO TOTAL PARA DEV
    if (subscription_data?.email === 'dev@sonnik.com.br' || status === 'admin') {
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

    // VERIFICAR ACESSO BASEADO NO NOVO STATUS
    const hasAccess = status === 'admin' || status === 'full_access' || status === 'trial';
    
    if (hasAccess) {
      console.log('✅ GUARD DEBUG: Acesso liberado:', { status, hasAccess });
      
      // Determinar limite de atletas
      let athleteLimit = Infinity;
      if (status === 'trial' && appSettings) {
        athleteLimit = appSettings.trial_athlete_limit;
      }
      
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
    
    console.log('❌ GUARD DEBUG: Acesso negado:', { status });
    
    // DETERMINAR MOTIVO DO BLOQUEIO
    let blockingReason: string | null = null;
    const trialExpired = status === 'restricted' && subscription_data?.subscription_status === 'trialing';
    
    if (trialExpired) {
      blockingReason = 'Seu período de teste expirou. Assine um plano para continuar usando a plataforma.';
    } else if (status === 'restricted') {
      blockingReason = 'Você não possui acesso ativo à plataforma. Verifique sua assinatura.';
    } else {
      blockingReason = 'Status de acesso não reconhecido. Entre em contato com o suporte.';
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