import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Loader2, Check, Star } from 'lucide-react';
import { Plan } from '../../types/database';
import { useCheckout } from '../../hooks/useCheckout';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  plan
}) => {
  const { createCheckoutSession, loading } = useCheckout();
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'mercadopago' | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getAthleteLimit = (limit: number) => {
    if (limit === -1) return 'Atletas ilimitados';
    return `Até ${limit} atletas ativos`;
  };

  const handleCheckout = async (gateway: 'stripe' | 'mercadopago') => {
    if (!plan) return;

    setSelectedGateway(gateway);
    
    const success_url = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${window.location.origin}/pricing`;

    const priceId = gateway === 'stripe' ? plan.stripe_price_id_monthly : plan.mercadopago_plan_id;
    
    if (!priceId) {
      alert('Configuração de pagamento não encontrada para este plano.');
      setSelectedGateway(null);
      return;
    }

    await createCheckoutSession({
      gateway,
      price_id: priceId,
      success_url,
      cancel_url,
    });

    setSelectedGateway(null);
  };

  if (!isOpen || !plan) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Finalizar Assinatura
                </h2>
                <p className="text-blue-100">
                  Escolha sua forma de pagamento preferida
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Plan Summary */}
          <div className="p-6 border-b border-slate-200">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {plan.name}
              </h3>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {formatPrice(plan.price_monthly)}
                <span className="text-lg text-slate-600 font-normal">/mês</span>
              </div>
              <p className="text-slate-600 mb-4">
                {getAthleteLimit(plan.max_athletes)}
              </p>
              
              {/* Trial Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-green-600" />
                <p className="text-green-800 text-sm font-medium">
                  30 dias grátis para testar • Cancele quando quiser
                </p>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="p-6 space-y-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-4">
              Escolha sua forma de pagamento:
            </h4>

            {/* Stripe Option */}
            <button
              onClick={() => handleCheckout('stripe')}
              disabled={loading || !plan.stripe_price_id_monthly}
              className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h5 className="font-semibold text-slate-900">Cartão de Crédito/Débito</h5>
                  <p className="text-sm text-slate-600">Processado pelo Stripe • Seguro e confiável</p>
                </div>
              </div>
              {selectedGateway === 'stripe' && loading && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </button>

            {/* Mercado Pago Option */}
            <button
              onClick={() => handleCheckout('mercadopago')}
              disabled={loading || !plan.mercadopago_plan_id}
              className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 font-bold text-sm">MP</span>
                </div>
                <div className="text-left">
                  <h5 className="font-semibold text-slate-900">PIX, Boleto ou Cartão</h5>
                  <p className="text-sm text-slate-600">Processado pelo Mercado Pago • Todas as opções</p>
                </div>
              </div>
              {selectedGateway === 'mercadopago' && loading && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-6 pt-0">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-slate-900">Pagamento 100% Seguro</span>
              </div>
              <p className="text-xs text-slate-600">
                Seus dados de pagamento são protegidos por criptografia SSL e nunca são armazenados em nossos servidores.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutModal;