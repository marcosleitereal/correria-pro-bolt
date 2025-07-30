import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { useAppSettings } from './useAppSettings';

interface SubscriptionStatus {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'coach' | 'admin' | null;
  subscription_status: 'trialing' | 'active' | 'canceled' | null;
  current_plan_name: string | null;
  plan_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  has_access: boolean | null;
}

export const useSubscriptionStatus = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings: appSettings, loading: appSettingsLoading } = useAppSettings();
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }
    
    console.log('🔄 SUBSCRIPTION STATUS: Iniciando busca (independente das configurações)...');
    
    fetchSubscriptionStatus();
    }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 SUBSCRIPTION DEBUG: Buscando status da assinatura para usuário:', user?.id);
      console.log('🔍 SUBSCRIPTION DEBUG: Email do usuário:', user?.email);

      // ACESSO TOTAL PARA DEV
      if (user?.email === 'dev@sonnik.com.br') {
        console.log('👑 SUBSCRIPTION DEBUG: Usuário dev detectado - acesso total');
        setSubscriptionStatus({
          user_id: user.id,
          email: user.email || null,
          full_name: 'Desenvolvedor Admin',
          role: 'admin',
          subscription_status: 'active',
          current_plan_name: 'Elite',
          plan_id: null,
          trial_ends_at: null,
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          has_access: true
        });
        setLoading(false);
        return;
      }

      // 1. BUSCAR DADOS COMPLETOS DA VIEW user_subscription_details
      console.log('📊 SUBSCRIPTION DEBUG: Buscando dados completos da view...');
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscription_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('❌ SUBSCRIPTION DEBUG: Erro ao buscar dados da view:', subscriptionError);
        throw subscriptionError;
      }

      console.log('📊 SUBSCRIPTION DEBUG: Dados da view recebidos:', subscriptionData);

      // Se não há dados na view, o usuário não tem perfil ou assinatura
      if (!subscriptionData) {
        console.log('⚠️ SUBSCRIPTION DEBUG: Nenhum dado encontrado na view - usuário sem perfil/assinatura');
        await createUserProfileAndTrial();
        return;
      }

      // 2. CALCULAR HAS_ACCESS - LÓGICA CORRIGIDA
      let hasAccess = false;
      const isRestrictedPlan = subscriptionData.current_plan_name === 'Restrito' || 
                              subscriptionData.current_plan_name === 'restrito' ||
                              subscriptionData.current_plan_name?.toLowerCase().includes('restrito');
      
      if (isRestrictedPlan) {
        console.log('🚫 SUBSCRIPTION STATUS: PLANO RESTRITO DETECTADO - BLOQUEANDO ACESSO');
        hasAccess = false;
      } else {
        // LÓGICA CRÍTICA CORRIGIDA: Verificar se há pagamentos do Stripe
        console.log('🔍 SUBSCRIPTION DEBUG: Verificando pagamentos do Stripe...');
        
        // Verificar se existe customer no Stripe (indica pagamento)
        const { data: stripeCustomer, error: stripeError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user?.id)
          .maybeSingle();
        
        console.log('💳 SUBSCRIPTION DEBUG: Stripe customer:', stripeCustomer);
        
        // Se tem customer no Stripe, FORÇAR ATIVAÇÃO
        if (stripeCustomer && stripeCustomer.customer_id) {
          console.log('🚀 SUBSCRIPTION DEBUG: CUSTOMER STRIPE ENCONTRADO - FORÇANDO ATIVAÇÃO');
          
          // Buscar primeiro plano ativo
          const { data: activePlan } = await supabase
            .from('plans')
            .select('id, name')
            .eq('is_active', true)
            .neq('name', 'Restrito')
            .order('price_monthly', { ascending: true })
            .limit(1)
            .single();
          
          // FORÇAR ATIVAÇÃO IMEDIATA
          const now = new Date();
          const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const { error: forceActivationError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              plan_id: activePlan?.id || null,
              status: 'active',
              trial_ends_at: null,
              current_period_start: now.toISOString(),
              current_period_end: oneMonthLater.toISOString(),
              updated_at: now.toISOString()
            }, { onConflict: 'user_id' });
          
          if (!forceActivationError) {
            console.log('✅ SUBSCRIPTION DEBUG: USUÁRIO ATIVADO FORÇADAMENTE!');
            hasAccess = true;
            
            // Atualizar dados locais
            subscriptionData.subscription_status = 'active';
            subscriptionData.current_plan_name = activePlan?.name || 'Plano Ativo';
            subscriptionData.trial_ends_at = null;
            subscriptionData.current_period_end = oneMonthLater.toISOString();
          }
        }
        
        // Lógica original como fallback
        if (subscriptionData.subscription_status === 'active') {
          hasAccess = true;
          console.log('✅ SUBSCRIPTION DEBUG: Status ACTIVE - acesso liberado');
        } else if (subscriptionData.subscription_status === 'trialing') {
          // Para trial, verificar se não expirou
          if (subscriptionData.trial_ends_at) {
            const trialEndDate = new Date(subscriptionData.trial_ends_at);
            const now = new Date();
            hasAccess = trialEndDate > now;
            console.log('🔍 SUBSCRIPTION DEBUG: Trial check:', {
              trial_ends_at: subscriptionData.trial_ends_at,
              now: now.toISOString(),
              hasAccess
            });
          } else {
            hasAccess = false;
          }
        } else {
          hasAccess = false;
        }
        console.log('✅ SUBSCRIPTION DEBUG: has_access final:', hasAccess);
      }

      // 3. MONTAR OBJETO FINAL usando dados da view
      const finalStatus: SubscriptionStatus = {
        user_id: user.id,
        email: subscriptionData.email,
        full_name: subscriptionData.full_name,
        role: subscriptionData.role,
        subscription_status: subscriptionData.subscription_status,
        current_plan_name: subscriptionData.current_plan_name,
        plan_id: subscriptionData.plan_id,
        trial_ends_at: subscriptionData.trial_ends_at,
        current_period_end: subscriptionData.current_period_end,
        has_access: hasAccess
      };

      console.log('✅ SUBSCRIPTION DEBUG: Status final calculado:', finalStatus);
      setSubscriptionStatus(finalStatus);
    } catch (err: any) {
      console.error('❌ SUBSCRIPTION DEBUG: Erro geral:', err);
      setError(err.message || 'Erro ao carregar status da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const createUserProfileAndTrial = async () => {
    try {
      // Buscar configurações do app
      const { data: dynamicSettings } = await supabase
        .from('app_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const trialDurationDays = dynamicSettings?.trial_duration_days || 35;
      
      // Criar perfil se não existir
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          full_name: user!.user_metadata?.full_name || null,
          email: user!.email,
          role: 'coach'
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ Erro ao criar perfil:', createProfileError);
        return;
      }
      
      // Criar trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);
      
      const { data: newSubscription, error: createSubError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user!.id,
          plan_id: null,
          status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt.toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();
      
      if (createSubError) {
        console.error('❌ Erro ao criar trial:', createSubError);
        return;
      }
      
      // Definir status final
      const finalStatus: SubscriptionStatus = {
        user_id: user!.id,
        email: newProfile.email,
        full_name: newProfile.full_name,
        role: newProfile.role,
        subscription_status: 'trialing',
        current_plan_name: null,
        plan_id: null,
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_end: trialEndsAt.toISOString(),
        has_access: true
      };
      
      setSubscriptionStatus(finalStatus);
    } catch (error) {
      console.error('❌ Erro ao criar perfil e trial:', error);
    }
  };

  // Função para forçar refresh dos dados após pagamento
  const refreshAfterPayment = async () => {
    console.log('🔄 SUBSCRIPTION DEBUG: Forçando refresh após pagamento...');
    await fetchSubscriptionStatus();
  };

  // Detectar se voltou de um checkout bem-sucedido
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && user) {
      console.log('💳 SUBSCRIPTION DEBUG: Session ID detectado, aguardando processamento do webhook...');
      // Aguardar webhook processar e depois fazer refresh - aumentando tempo para 15 segundos
      setTimeout(() => {
        refreshAfterPayment();
      }, 15000); // 15 segundos para webhook processar
      
      // Fazer refresh adicional após 30 segundos se ainda não funcionou
      setTimeout(() => {
        console.log('🔄 SUBSCRIPTION DEBUG: Segundo refresh após 30 segundos...');
        refreshAfterPayment();
      }, 30000);
    }
  }, [user]);

  const isTrialing = subscriptionStatus?.subscription_status === 'trialing';
  const isActive = subscriptionStatus?.subscription_status === 'active';
  const isCanceled = subscriptionStatus?.subscription_status === 'canceled';
  const hasAccess = subscriptionStatus?.has_access === true;

  const daysUntilTrialEnd = subscriptionStatus?.trial_ends_at 
    ? Math.ceil((new Date(subscriptionStatus.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // LOGS FINAIS PARA DEBUG
  console.log('🎯 SUBSCRIPTION DEBUG: Valores finais do hook:', {
    isTrialing,
    isActive,
    hasAccess,
    daysUntilTrialEnd,
    subscription_status: subscriptionStatus?.subscription_status,
    current_plan_name: subscriptionStatus?.current_plan_name,
    plan_id: subscriptionStatus?.plan_id
  });

  return {
    subscriptionStatus,
    loading,
    error,
    isTrialing,
    isActive,
    isCanceled,
    hasAccess,
    daysUntilTrialEnd,
    refetch: fetchSubscriptionStatus,
    refreshAfterPayment,
  };
};