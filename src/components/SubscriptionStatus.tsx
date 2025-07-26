import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { getProductByPriceId } from '../stripe-config';

const SubscriptionStatus: React.FC = () => {
  const { subscription, loading, error, isActive, isTrialing, isCanceled, isPastDue } = useSubscription();

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-700">Erro ao carregar status da assinatura: {error}</p>
      </div>
    );
  }

  if (!subscription || !subscription.subscription_id) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-slate-400" />
          <div>
            <h3 className="font-semibold text-slate-900">Nenhuma assinatura ativa</h3>
            <p className="text-slate-600">Você não possui uma assinatura ativa no momento.</p>
          </div>
        </div>
      </div>
    );
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null;

  const getStatusInfo = () => {
    if (isActive) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        title: 'Assinatura Ativa',
        description: 'Sua assinatura está ativa e funcionando normalmente.',
      };
    }
    
    if (isTrialing) {
      return {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        title: 'Período de Teste',
        description: 'Você está no período de teste gratuito.',
      };
    }
    
    if (isCanceled) {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: 'Assinatura Cancelada',
        description: 'Sua assinatura foi cancelada.',
      };
    }
    
    if (isPastDue) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        title: 'Pagamento em Atraso',
        description: 'Há um problema com o pagamento da sua assinatura.',
      };
    }

    return {
      icon: Clock,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      title: 'Status Desconhecido',
      description: 'Status da assinatura não reconhecido.',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-xl p-6`}
    >
      <div className="flex items-start gap-4">
        <StatusIcon className={`w-6 h-6 ${statusInfo.color} flex-shrink-0 mt-1`} />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">{statusInfo.title}</h3>
          <p className="text-slate-600 mb-4">{statusInfo.description}</p>
          
          {product && (
            <div className="space-y-2">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Plano:</span> {product.name}
              </p>
              {subscription.current_period_end && (
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Próxima cobrança:</span>{' '}
                  {new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR')}
                </p>
              )}
              {subscription.payment_method_brand && subscription.payment_method_last4 && (
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Cartão:</span>{' '}
                  {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SubscriptionStatus;