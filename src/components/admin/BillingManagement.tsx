import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  CreditCard, 
  DollarSign, 
  Users, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { usePlans } from '../../hooks/usePlans';
import { usePaymentGateways } from '../../hooks/usePaymentGateways';
import PlanModal from './PlanModal';
import { Plan } from '../../types/database';
import TrialSettingsCard from './TrialSettingsCard';
import SubscriptionManagement from './SubscriptionManagement';

const BillingManagement: React.FC = () => {
  const { 
    plans, 
    loading: plansLoading, 
    error: plansError, 
    updatePlan 
  } = usePlans();
  
  const {
    gateways,
    loading: gatewaysLoading,
    error: gatewaysError,
    updateGateway
  } = usePaymentGateways();

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showSecretKeys, setShowSecretKeys] = useState<Record<string, boolean>>({});
  const [savingGateways, setSavingGateways] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [gatewayConfig, setGatewayConfig] = useState({
    stripe_public_key: '',
    stripe_secret_key: '',
    mercadopago_public_key: '',
    mercadopago_access_token: ''
  });

  React.useEffect(() => {
    if (gateways.length > 0) {
      const stripe = gateways.find(g => g.gateway_name === 'stripe');
      const mercadopago = gateways.find(g => g.gateway_name === 'mercadopago');
      
      setGatewayConfig({
        stripe_public_key: stripe?.public_key || '',
        stripe_secret_key: '', // Never pre-fill secret keys
        mercadopago_public_key: mercadopago?.public_key || '',
        mercadopago_access_token: '' // Never pre-fill secret keys
      });
    }
  }, [gateways]);

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setIsPlanModalOpen(true);
  };

  const handleUpdatePlan = async (planData: Partial<Plan>) => {
    if (!editingPlan) return;
    
    const success = await updatePlan(editingPlan.id, planData);
    if (success) {
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      showSuccess('Plano atualizado com sucesso!');
    }
  };

  const handleSaveGateways = async () => {
    setSavingGateways(true);
    try {
      // Update Stripe configuration
      if (gatewayConfig.stripe_public_key || gatewayConfig.stripe_secret_key) {
        const stripeData: any = {
          public_key: gatewayConfig.stripe_public_key || null
        };
        
        if (gatewayConfig.stripe_secret_key) {
          stripeData.secret_key_encrypted = gatewayConfig.stripe_secret_key; // Will be encrypted server-side
        }

        await updateGateway('stripe', stripeData);
      }

      // Update Mercado Pago configuration
      if (gatewayConfig.mercadopago_public_key || gatewayConfig.mercadopago_access_token) {
        const mercadopagoData: any = {
          public_key: gatewayConfig.mercadopago_public_key || null
        };
        
        if (gatewayConfig.mercadopago_access_token) {
          mercadopagoData.secret_key_encrypted = gatewayConfig.mercadopago_access_token; // Will be encrypted server-side
        }

        await updateGateway('mercadopago', mercadopagoData);
      }

      showSuccess('Configurações dos gateways salvas com sucesso!');
      
      // Reset secret fields after successful save
      setGatewayConfig(prev => ({
        ...prev,
        stripe_secret_key: '',
        mercadopago_access_token: ''
      }));
    } catch (error) {
      console.error('Erro ao salvar configurações dos gateways:', error);
    } finally {
      setSavingGateways(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const toggleSecretKeyVisibility = (field: string) => {
    setShowSecretKeys(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive 
          ? 'bg-green-100 text-green-700' 
          : 'bg-slate-100 text-slate-700'
      }`}>
        {isActive ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Ativo
          </>
        ) : (
          <>
            <X className="w-4 h-4 mr-1" />
            Inativo
          </>
        )}
      </span>
    );
  };

  if (plansLoading || gatewaysLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="bg-slate-50 rounded-lg p-6">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 w-full overflow-x-hidden">
      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </motion.div>
      )}

      {/* Error States */}
      {(plansError || gatewaysError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar dados de faturamento</p>
            <p className="text-sm">{plansError || gatewaysError}</p>
          </div>
        </motion.div>
      )}

      {/* Gestão de Planos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6" />
              <div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold">Gestão de Planos</h3>
                <p className="text-green-100 text-sm sm:text-base">
                  Configure os planos de assinatura disponíveis na plataforma
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 w-full">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Nome do Plano</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Preço</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Limite de Atletas</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {plans.map((plan, index) => (
                  <motion.tr
                    key={plan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-slate-900">{plan.name}</p>
                        {plan.description && (
                          <p className="text-sm text-slate-600">{plan.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-lg font-bold text-slate-900">
                        {formatPrice(plan.price_monthly)}
                      </span>
                      <span className="text-slate-600 text-sm">/mês</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">
                          {plan.max_athletes === -1 ? 'Ilimitado' : `${plan.max_athletes} atletas`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(plan.is_active)}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar plano"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 w-full">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-slate-50 rounded-lg p-4 space-y-3 w-full"
              >
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
                    )}
                  </div>
                  {getStatusBadge(plan.is_active)}
                </div>

                {/* Plan Details */}
                <div className="space-y-3 text-sm w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-slate-500">Preço:</span>
                    <span className="font-bold text-slate-900">
                      {formatPrice(plan.price_monthly)}/mês
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-slate-500">Limite:</span>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">
                        {plan.max_athletes === -1 ? 'Ilimitado' : `${plan.max_athletes} atletas`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center sm:justify-end pt-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                    title="Editar plano"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="sm:hidden">Editar</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Configuração dos Gateways */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden w-full"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6" />
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold">Configuração dos Gateways de Pagamento</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Configure as chaves de API dos provedores de pagamento
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 w-full">
          {/* Security Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-medium">Segurança</p>
              <p className="text-yellow-700 text-sm">
                As chaves secretas são criptografadas antes de serem armazenadas no banco de dados.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 w-full">
            {/* Stripe Configuration */}
            <div className="space-y-4 w-full">
              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">S</span>
                </div>
                Stripe
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chave Pública (Publishable Key)
                </label>
                <input
                  type="text"
                  value={gatewayConfig.stripe_public_key}
                  onChange={(e) => setGatewayConfig(prev => ({
                    ...prev,
                    stripe_public_key: e.target.value
                  }))}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-xs sm:text-sm break-all"
                  placeholder="pk_live_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chave Secreta (Secret Key)
                </label>
                <div className="relative">
                  <input
                    type={showSecretKeys.stripe ? 'text' : 'password'}
                    value={gatewayConfig.stripe_secret_key}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      stripe_secret_key: e.target.value
                    }))}
                    className="w-full px-3 py-2 pr-10 sm:px-4 sm:py-3 sm:pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-xs sm:text-sm break-all"
                    placeholder="sk_live_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretKeyVisibility('stripe')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecretKeys.stripe ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Mercado Pago Configuration */}
            <div className="space-y-4 w-full">
              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">MP</span>
                </div>
                Mercado Pago
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Chave Pública (Public Key)
                </label>
                <input
                  type="text"
                  value={gatewayConfig.mercadopago_public_key}
                  onChange={(e) => setGatewayConfig(prev => ({
                    ...prev,
                    mercadopago_public_key: e.target.value
                  }))}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-mono text-xs sm:text-sm break-all"
                  placeholder="APP_USR_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Token de Acesso (Access Token)
                </label>
                <div className="relative">
                  <input
                    type={showSecretKeys.mercadopago ? 'text' : 'password'}
                    value={gatewayConfig.mercadopago_access_token}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      mercadopago_access_token: e.target.value
                    }))}
                    className="w-full px-3 py-2 pr-10 sm:px-4 sm:py-3 sm:pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors font-mono text-xs sm:text-sm break-all"
                    placeholder="APP_USR_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleSecretKeyVisibility('mercadopago')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showSecretKeys.mercadopago ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-slate-200 w-full">
            <button
              onClick={handleSaveGateways}
              disabled={savingGateways}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {savingGateways && <Loader2 className="w-5 h-5 animate-spin" />}
              <Save className="w-5 h-5" />
              <span className="hidden sm:inline">Salvar Configurações dos Gateways</span>
              <span className="sm:hidden">Salvar Configurações</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Configurações do Período de Teste */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full"
      >
        <TrialSettingsCard />
      </motion.div>

      {/* Gerenciamento de Assinaturas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full"
      >
        <SubscriptionManagement />
      </motion.div>

      {/* Plan Modal */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleUpdatePlan}
        plan={editingPlan}
        loading={plansLoading}
      />
    </div>
  );
};

export default BillingManagement;