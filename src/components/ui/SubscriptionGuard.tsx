import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Crown, Users, Calendar } from 'lucide-react';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature: 'create_runner' | 'generate_training' | 'general';
  fallback?: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature,
  fallback
}) => {
  const {
    canCreateRunner,
    canGenerateTraining,
    canAccessFeature,
    trialExpired,
    athleteLimitReached,
    blockingReason,
    showUpgradeModal,
    getAthleteCountDisplay
  } = useSubscriptionGuard();

  const canAccess = () => {
    switch (feature) {
      case 'create_runner':
        return canCreateRunner;
      case 'generate_training':
        return canGenerateTraining;
      case 'general':
        return canAccessFeature;
      default:
        return false;
    }
  };

  console.log('🛡️ SUBSCRIPTION GUARD DEBUG:', {
    feature,
    canAccess: canAccess(),
    canCreateRunner,
    canGenerateTraining,
    canAccessFeature,
    trialExpired,
    blockingReason
  });

  const getIcon = () => {
    if (trialExpired) return Calendar;
    if (athleteLimitReached) return Users;
    if (blockingReason?.includes('restrito')) return AlertTriangle;
    return Crown;
  };

  const getTitle = () => {
    if (trialExpired) return 'Período de Teste Expirado';
    if (athleteLimitReached) return 'Limite de Atletas Atingido';
    if (blockingReason?.includes('restrito')) return 'Conta Restrita';
    return 'Acesso Restrito';
  };

  const getDescription = () => {
    if (trialExpired) {
      return 'Seu teste gratuito de 30 dias chegou ao fim. Assine um plano para continuar aproveitando todos os recursos da Correria.Pro.';
    }
    if (athleteLimitReached) {
      return `Você está usando ${getAthleteCountDisplay()}. Faça upgrade do seu plano para adicionar mais atletas e expandir sua operação.`;
    }
    if (blockingReason?.includes('restrito')) {
      return 'Sua conta foi colocada em modo restrito. Entre em contato com o suporte ou faça upgrade para um plano pago.';
    }
    return 'Você precisa de uma assinatura ativa para acessar este recurso.';
  };

  if (canAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 text-center"
    >
      <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-orange-600" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-3">
        {getTitle()}
      </h3>
      
      <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
        {getDescription()}
      </p>

      {blockingReason && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-orange-800 text-sm font-medium text-left">
              {blockingReason}
            </p>
          </div>
        </div>
      )}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={showUpgradeModal}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {trialExpired ? 'Assinar Agora' : 'Fazer Upgrade'}
      </motion.button>
    </motion.div>
  );
};

export default SubscriptionGuard;