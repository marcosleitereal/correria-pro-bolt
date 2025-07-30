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

      console.log('🔍 SUBSCRIPTION: Buscando status para usuário:', user?.id, user?.email);

      // ACESSO TOTAL PARA DEV
      if (user?.email === 'dev@sonnik.com.br') {
        console.log('👑 SUBSCRIPTION: Usuário dev - acesso total liberado');
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

      // BUSCAR DADOS DA VIEW user_subscription_details
      console.log('📊 SUBSCRIPTION: Buscando dados da view user_subscription_details...');
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscription_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('❌ SUBSCRIPTION: Erro ao buscar view:', subscriptionError);
        throw subscriptionError;
      }

      console.log('📊 SUBSCRIPTION: Dados recebidos:', subscriptionData);

      // Se não há dados, criar perfil e trial automaticamente
      if (!subscriptionData) {
        console.log('⚠️ SUBSCRIPTION: Usuário sem dados - criando perfil e trial...');
        await createUserProfileAndTrial();
        return;
      }

      // CALCULAR HAS_ACCESS
      let hasAccess = false;
      const isRestrictedPlan = subscriptionData.current_plan_name === 'Restrito' || 
                              subscriptionData.current_plan_name === 'restrito' ||
                              subscriptionData.current_plan_name?.toLowerCase().includes('restrito');
      
      if (isRestrictedPlan) {
        console.log('🚫 SUBSCRIPTION: PLANO RESTRITO - BLOQUEANDO ACESSO');
        hasAccess = false;
      } else {
        // Verificar se há customer no Stripe (indica pagamento)
        console.log('🔍 SUBSCRIPTION: Verificando customer Stripe...');
        
        const { data: stripeCustomer, error: stripeError } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', user?.id)
          .maybeSingle();
        
        console.log('💳 SUBSCRIPTION: Customer encontrado:', !!stripeCustomer);
        
        // Se tem customer no Stripe, deve estar ativo
        if (stripeCustomer && stripeCustomer.customer_id) {
          console.log('🚀 SUBSCRIPTION: Customer Stripe encontrado - ativando usuário');
          
          // Se tem customer, deve ter acesso (será ativado pelo webhook)
          hasAccess = true;
        } else {
          // Lógica normal para usuários sem pagamento
          if (subscriptionData.subscription_status === 'active') {
            hasAccess = true;
            console.log('✅ SUBSCRIPTION: Status ACTIVE - acesso liberado');
          } else if (subscriptionData.subscription_status === 'trialing') {
            // Para trial, verificar se não expirou
            if (subscriptionData.trial_ends_at) {
              const trialEndDate = new Date(subscriptionData.trial_ends_at);
              const now = new Date();
              hasAccess = trialEndDate > now;
              
              const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              console.log('🔍 SUBSCRIPTION: Trial check:', {
                trial_ends_at: subscriptionData.trial_ends_at,
                days_left: daysLeft,
                hasAccess
              });
            } else {
              hasAccess = false;
            }
          } else {
            hasAccess = false;
          }
        }
      }

      console.log('✅ SUBSCRIPTION: has_access calculado:', hasAccess);

      // MONTAR OBJETO FINAL
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

      console.log('✅ SUBSCRIPTION: Status final:', {
        subscription_status: finalStatus.subscription_status,
        current_plan_name: finalStatus.current_plan_name,
        has_access: finalStatus.has_access,
        trial_ends_at: finalStatus.trial_ends_at
      });
      
      setSubscriptionStatus(finalStatus);
    } catch (err: any) {
      console.error('❌ SUBSCRIPTION: Erro geral:', err);
      setError(err.message || 'Erro ao carregar status da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const createUserProfileAndTrial = async () => {
    try {
      console.log('🚀 SUBSCRIPTION: Criando perfil e trial automático...');
      
      // CRÍTICO: Buscar configurações dinâmicas do painel admin
      const { data: dynamicSettings } = await supabase
        .from('app_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // USAR VALORES DO PAINEL ADMIN (não hardcoded)
      const trialDurationDays = dynamicSettings?.trial_duration_days || 30; // fallback mais conservador
      const trialAthleteLimit = dynamicSettings?.trial_athlete_limit || 5;
      const trialTrainingLimit = dynamicSettings?.trial_training_limit || 10;
      
      console.log('📊 SUBSCRIPTION: Configurações aplicadas:', {
        trial_duration_days: trialDurationDays,
        trial_athlete_limit: trialAthleteLimit,
        trial_training_limit: trialTrainingLimit,
        fonte: dynamicSettings ? 'Painel Admin' : 'Valores padrão'
      });
      
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
      }
      
      console.log('✅ SUBSCRIPTION: Perfil criado:', newProfile?.full_name);
      
      // CRIAR TRIAL COM DURAÇÃO CORRETA
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);
      
      console.log('🎯 SUBSCRIPTION: Criando trial de', trialDurationDays, 'dias até:', trialEndsAt.toLocaleDateString('pt-BR'));
      
      const { data: newSubscription, error: createSubError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user!.id,
          plan_id: null,
          status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt.toISOString(),
        })
        .select()
        .single();
      
      if (createSubError) {
        console.error('❌ Erro ao criar trial:', createSubError);
        throw createSubError;
      }
      
      console.log('✅ SUBSCRIPTION: Trial criado com sucesso');
      
      // DEFINIR STATUS FINAL
      const finalStatus: SubscriptionStatus = {
        user_id: user!.id,
        email: newProfile?.email || user!.email,
        full_name: newProfile?.full_name || user!.user_metadata?.full_name,
        role: newProfile?.role || 'coach',
        subscription_status: 'trialing',
        current_plan_name: null,
        plan_id: null,
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_end: trialEndsAt.toISOString(),
        has_access: true
      };
      
      console.log('🎉 SUBSCRIPTION: Trial ativo por', trialDurationDays, 'dias');
      setSubscriptionStatus(finalStatus);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao criar perfil e trial:', error);
      setError('Erro ao ativar período de teste');
      setLoading(false);
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