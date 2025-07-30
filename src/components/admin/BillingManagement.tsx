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
  Save,
  Clock
} from 'lucide-react';
import { usePlans } from '../../hooks/usePlans';
import { usePaymentGateways } from '../../hooks/usePaymentGateways';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import GatewayConfigModal from './GatewayConfigModal';
import PlanModal from './PlanModal';
import { Plan } from '../../types/database';
import TrialSettingsModal from './TrialSettingsModal';
import SubscriptionManagement from './SubscriptionManagement';

const BillingManagement: React.FC = () => {
  const { user } = useAuthContext();
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

  const {
    settings: appSettings,
    loading: appSettingsLoading,
    updateSettings: updateAppSettings,
    refreshSettings
  } = useAppSettings();

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showSecretKeys, setShowSecretKeys] = useState<Record<string, boolean>>({});
  const [savingGateways, setSavingGateways] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [manualActivationEmail, setManualActivationEmail] = useState('');
  const [activatingUser, setActivatingUser] = useState(false);

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

  const handleSaveGateways = async (gatewayData: any) => {
    try {
      console.log('💾 BILLING: Recebendo dados do modal:', gatewayData);
      
      // Update Stripe configuration
      if (gatewayData.stripe_public_key || gatewayData.stripe_secret_key) {
        const stripeData: any = {};
        
        if (gatewayData.stripe_public_key) {
          stripeData.public_key = gatewayData.stripe_public_key.trim();
        }
        
        if (gatewayData.stripe_secret_key) {
          stripeData.secret_key_encrypted = gatewayData.stripe_secret_key.trim();
        }

        console.log('💾 BILLING: Salvando Stripe:', stripeData);
        const stripeSuccess = await updateGateway('stripe', stripeData);
        if (!stripeSuccess) {
          throw new Error('Falha ao salvar configurações do Stripe');
        }
      }

      // Update Mercado Pago configuration
      if (gatewayData.mercadopago_public_key || gatewayData.mercadopago_access_token) {
        const mercadopagoData: any = {};
        
        if (gatewayData.mercadopago_public_key) {
          mercadopagoData.public_key = gatewayData.mercadopago_public_key.trim();
        }
        
        if (gatewayData.mercadopago_access_token) {
          mercadopagoData.secret_key_encrypted = gatewayData.mercadopago_access_token.trim();
        }

        console.log('💾 BILLING: Salvando Mercado Pago:', mercadopagoData);
        const mpSuccess = await updateGateway('mercadopago', mercadopagoData);
        if (!mpSuccess) {
          throw new Error('Falha ao salvar configurações do Mercado Pago');
        }
      }

      showSuccess('Configurações dos gateways salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ BILLING: Erro ao salvar configurações:', error);
      showSuccess('Erro ao salvar configurações. Tente novamente.');
      return false;
    }
  };

  const handleSaveTrialSettings = async (settings: any) => {
    try {
      console.log('💾 SALVANDO configurações via useAppSettings:', settings);
      
      // Usar o hook correto para salvar
      const success = await updateAppSettings(settings);
      
      if (success) {
        console.log('✅ Configurações salvas com sucesso via hook');
        showSuccess('Configurações do período de teste salvas com sucesso!');
        setIsTrialModalOpen(false);
        
        // Refresh dos dados para mostrar novos valores
        await refreshSettings();
      } else {
        throw new Error('Falha ao salvar configurações');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      showSuccess('Erro ao salvar configurações. Tente novamente.');
      return false;
    }
  };

  const handleManualActivation = async () => {
    if (!manualActivationEmail || !user?.id) return;

    setActivatingUser(true);
    try {
      // ATIVAÇÃO DIRETA VIA SUPABASE (mais confiável)
      console.log('🚀 MANUAL ACTIVATION: Ativando usuário diretamente:', manualActivationEmail);
      
      // Buscar usuário pelo email
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', manualActivationEmail)
        .single();

      if (profileError || !targetProfile) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar primeiro plano ativo
      const { data: activePlan, error: planError } = await supabase
        .from('plans')
        .select('id, name')
        .eq('is_active', true)
        .neq('name', 'Restrito')
        .order('price_monthly', { ascending: true })
        .limit(1)
        .single();

      if (planError || !activePlan) {
        throw new Error('Nenhum plano ativo encontrado');
      }

      // ATIVAR ASSINATURA DIRETAMENTE
      const now = new Date();
      const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error: activationError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: targetProfile.id,
          plan_id: activePlan.id,
          status: 'active',
          trial_ends_at: null,
          current_period_start: now.toISOString(),
          current_period_end: oneMonthLater.toISOString(),
          updated_at: now.toISOString()
        }, { onConflict: 'user_id' });

      if (activationError) {
        throw new Error(`Erro ao ativar: ${activationError.message}`);
      }

      // Criar log de auditoria
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'MANUAL_USER_ACTIVATION_DIRECT',
        details: {
          target_user_id: targetProfile.id,
          target_user_email: manualActivationEmail,
          target_user_name: targetProfile.full_name,
          activated_plan: activePlan.name,
          activated_at: now.toISOString()
        }
      });

      showSuccess(`✅ Usuário ${targetProfile.full_name} (${manualActivationEmail}) foi ativado no plano ${activePlan.name}!`);
      setManualActivationEmail('');
      
    } catch (error: any) {
      console.error('❌ Erro ao ativar usuário:', error);
      showSuccess(`❌ Erro: ${error.message}`);
    } finally {
      setActivatingUser(false);
    }
  };

  const handleManualActivationOld = async () => {
    if (!manualActivationEmail || !session?.access_token) return;

    setActivatingUser(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manual-activate-user`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: manualActivationEmail
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao ativar usuário');
      }

      showSuccess(`Usuário ${manualActivationEmail} foi ativado com sucesso!`);
      setManualActivationEmail('');
    } catch (error: any) {
      console.error('Erro ao ativar usuário:', error);
      showSuccess(`Erro: ${error.message}`);
    } finally {
      setActivatingUser(false);
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
            {/* Current Status */}
            <div className="bg-slate-50 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-medium text-slate-700 mb-4">Status Atual dos Gateways:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h5 className="font-semibold text-slate-900">Stripe</h5>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-600">
                      Chave Pública: {gateways.find(g => g.gateway_name === 'stripe')?.public_key ? '✅ Configurada' : '❌ Não configurada'}
                    </p>
                    <p className="text-slate-600">
                      Chave Secreta: {gateways.find(g => g.gateway_name === 'stripe')?.secret_key_encrypted ? '✅ Configurada' : '❌ Não configurada'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">MP</span>
                    </div>
                    <h5 className="font-semibold text-slate-900">Mercado Pago</h5>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-600">
                      Chave Pública: {gateways.find(g => g.gateway_name === 'mercadopago')?.public_key ? '✅ Configurada' : '❌ Não configurada'}
                    </p>
                    <p className="text-slate-600">
                      Token de Acesso: {gateways.find(g => g.gateway_name === 'mercadopago')?.secret_key_encrypted ? '✅ Configurada' : '❌ Não configurada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Configure Button */}
            <button
              onClick={() => setIsGatewayModalOpen(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Configurar Chaves dos Gateways
            </button>
          </div>
      </motion.div>

      {/* Configurações do Período de Teste */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full"
      >
        {/* Configurações do Período de Teste - Inline */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6" />
                <div>
                  <h3 className="text-xl font-bold">Configurações do Período de Teste</h3>
                  <p className="text-orange-100">
                    Configure os limites e duração do período de avaliação gratuita
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsTrialModalOpen(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <Edit className="w-5 h-5" />
                <span className="text-sm font-medium">Editar</span>
              </motion.button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-slate-700 mb-4">Configurações Atuais:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {appSettingsLoading ? '...' : (appSettings?.trial_duration_days || 35)}
                  </div>
                  <div className="text-sm text-slate-600">Dias de Teste</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {appSettingsLoading ? '...' : (appSettings?.trial_athlete_limit || 33)}
                  </div>
                  <div className="text-sm text-slate-600">Atletas Máximo</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {appSettingsLoading ? '...' : (appSettings?.trial_training_limit || 44)}
                  </div>
                  <div className="text-sm text-slate-600">Treinos Máximo</div>
                </div>
              </div>
              {appSettings?.updated_at && (
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Última atualização: {new Date(appSettings.updated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gerenciamento de Assinaturas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full"
      >
        {/* Ativação Manual de Usuário */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="text-xl font-bold">🚨 Ativação Manual de Usuário</h3>
                <p className="text-red-100">
                  Para usuários que pagaram mas não foram ativados automaticamente
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Email do usuário para ativar"
                value={manualActivationEmail}
                onChange={(e) => setManualActivationEmail(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
              <button
                onClick={handleManualActivation}
                disabled={!manualActivationEmail || activatingUser}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {activatingUser && <Loader2 className="w-5 h-5 animate-spin" />}
                🚀 Ativar Usuário
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Digite o email do usuário que pagou mas continua bloqueado
            </p>
          </div>
        </div>

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

      {/* Trial Settings Modal */}
      <TrialSettingsModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        onSave={handleSaveTrialSettings}
        initialSettings={appSettings}
        loading={false}
      />

      {/* Gateway Config Modal */}
      <GatewayConfigModal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        onSave={handleSaveGateways}
        loading={gatewaysLoading}
      />
    </div>
  );
};

export default BillingManagement;