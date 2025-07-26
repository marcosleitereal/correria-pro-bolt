import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

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

interface GuardStatus {
  status: 'admin' | 'full_access' | 'trial' | 'restricted';
  days_left: number | null;
  hours_left: number | null;
  subscription_data: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
}

export const useSubscriptionStatus = (): GuardStatus => {
  const [guardStatus, setGuardStatus] = useState<GuardStatus>({
    status: 'restricted',
    days_left: null,
    hours_left: null,
    subscription_data: null,
    loading: true,
    error: null,
  });

  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      console.log('🛡️ GUARD: Usuário não autenticado - status restrito');
      setGuardStatus({
        status: 'restricted',
        days_left: null,
        hours_left: null,
        subscription_data: null,
        loading: false,
        error: null,
      });
      return;
    }

    fetchAndCalculateStatus();
  }, [user]);

  const fetchAndCalculateStatus = async () => {
    try {
      console.log('🛡️ GUARD: Iniciando verificação de status para usuário:', user?.id);
      setGuardStatus(prev => ({ ...prev, loading: true, error: null }));

      // ACESSO TOTAL PARA DEV (BYPASS COMPLETO)
      if (user?.email === 'dev@sonnik.com.br') {
        console.log('👑 GUARD: Usuário dev detectado - acesso admin total');
        setGuardStatus({
          status: 'admin',
          days_left: null,
          hours_left: null,
          subscription_data: {
            user_id: user.id,
            email: user.email,
            full_name: 'Desenvolvedor Admin',
            role: 'admin',
            subscription_status: 'active',
            current_plan_name: 'Elite',
            plan_id: null,
            trial_ends_at: null,
            current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            has_access: true
          },
          loading: false,
          error: null,
        });
        return;
      }

      // ETAPA 1: BUSCAR PERFIL DO USUÁRIO
      console.log('📊 GUARD: Buscando perfil do usuário...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ GUARD: Erro ao buscar perfil:', profileError);
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }

      if (!profileData) {
        console.log('⚠️ GUARD: Perfil não encontrado - criando dados básicos do usuário:', user?.id);
        setGuardStatus({
          status: 'restricted',
          days_left: 0,
          hours_left: 0,
          subscription_data: {
            user_id: user.id,
            email: user.email || null,
            full_name: null,
            role: null,
            subscription_status: null,
            current_plan_name: null,
            plan_id: null,
            trial_ends_at: null,
            current_period_end: null,
            has_access: false
          },
          loading: false,
          error: null,
        });
        return;
      }

      console.log('✅ GUARD: Perfil encontrado:', profileData);

      // VERIFICAÇÃO DE ADMIN (PRIMEIRA PRIORIDADE)
      if (profileData.role === 'admin') {
        console.log('👑 GUARD: Usuário é admin - acesso total liberado');
        setGuardStatus({
          status: 'admin',
          days_left: null,
          hours_left: null,
          subscription_data: {
            user_id: user.id,
            email: profileData.email,
            full_name: profileData.full_name,
            role: 'admin',
            subscription_status: 'active',
            current_plan_name: 'Administrador',
            plan_id: null,
            trial_ends_at: null,
            current_period_end: null,
            has_access: true
          },
          loading: false,
          error: null,
        });
        return;
      }

      // ETAPA 2: BUSCAR ASSINATURA DO USUÁRIO (APENAS PARA COACHES)
      console.log('📊 GUARD: Usuário é coach - buscando assinatura...');
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('❌ GUARD: Erro ao buscar assinatura:', subscriptionError);
        throw new Error(`Erro ao buscar assinatura: ${subscriptionError.message}`);
      }

      console.log('📊 GUARD: Dados da assinatura encontrados:', subscriptionData);

      // ETAPA 3: BUSCAR NOME DO PLANO SE HOUVER
      let planName = null;
      if (subscriptionData?.plan_id) {
        console.log('📊 GUARD: Buscando nome do plano:', subscriptionData.plan_id);
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('name')
          .eq('id', subscriptionData.plan_id)
          .single();

        if (!planError && planData) {
          planName = planData.name;
          console.log('✅ GUARD: Nome do plano encontrado:', planName);
        }
      }

      // MONTAR OBJETO DE DADOS DA ASSINATURA
      const subscriptionStatusData: SubscriptionStatus = {
        user_id: user.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role,
        subscription_status: subscriptionData?.status || null,
        current_plan_name: planName,
        plan_id: subscriptionData?.plan_id || null,
        trial_ends_at: subscriptionData?.trial_ends_at || null,
        current_period_end: subscriptionData?.current_period_end || null,
        has_access: false // Será calculado abaixo
      };

      // ETAPA 4: APLICAR LÓGICA ESTRITA DO GUARDA
      console.log('🎯 GUARD: Aplicando lógica estrita de acesso...');

      if (!subscriptionData) {
        console.log('❌ GUARD: Nenhuma assinatura encontrada - acesso restrito');
        setGuardStatus({
          status: 'restricted',
          days_left: 0,
          hours_left: 0,
          subscription_data: { ...subscriptionStatusData, has_access: false },
          loading: false,
          error: null,
        });
        return;
      }

      // VERIFICAR ASSINATURA ATIVA
      if (subscriptionData.status === 'active') {
        console.log('✅ GUARD: Assinatura ativa - acesso total liberado');
        setGuardStatus({
          status: 'full_access',
          days_left: null,
          hours_left: null,
          subscription_data: { ...subscriptionStatusData, has_access: true },
          loading: false,
          error: null,
        });
        return;
      }

      // VERIFICAR TRIAL VÁLIDO
      if (subscriptionData.status === 'trialing' && subscriptionData.trial_ends_at) {
        const trialEndDate = new Date(subscriptionData.trial_ends_at);
        const now = new Date();
        const timeLeft = trialEndDate.getTime() - now.getTime();

        console.log('🕐 GUARD: Verificando trial:', {
          trial_ends_at: subscriptionData.trial_ends_at,
          trial_end_date: trialEndDate.toLocaleString('pt-BR'),
          now: now.toLocaleString('pt-BR'),
          time_left_ms: timeLeft
        });

        if (timeLeft > 0) {
          const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
          const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));

          console.log('✅ GUARD: Trial válido - acesso liberado:', {
            days_left: daysLeft,
            hours_left: hoursLeft
          });

          setGuardStatus({
            status: 'trial',
            days_left: daysLeft,
            hours_left: hoursLeft,
            subscription_data: { ...subscriptionStatusData, has_access: true },
            loading: false,
            error: null,
          });
          return;
        } else {
          console.log('❌ GUARD: Trial expirado - acesso restrito');
          setGuardStatus({
            status: 'restricted',
            days_left: 0,
            hours_left: 0,
            subscription_data: { ...subscriptionStatusData, has_access: false },
            loading: false,
            error: null,
          });
          return;
        }
      }

      // TODOS OS OUTROS CASOS = ACESSO RESTRITO
      console.log('❌ GUARD: Status não reconhecido ou inválido - acesso restrito');
      setGuardStatus({
        status: 'restricted',
        days_left: 0,
        hours_left: 0,
        subscription_data: { ...subscriptionStatusData, has_access: false },
        loading: false,
        error: null,
      });

    } catch (err: any) {
      console.error('❌ GUARD: Erro geral na verificação de status:', err);
      setGuardStatus({
        status: 'restricted',
        days_left: 0,
        hours_left: 0,
        subscription_data: null,
        loading: false,
        error: err.message || 'Erro ao verificar status da assinatura',
      });
    }
  };

  // FUNÇÕES AUXILIARES PARA COMPATIBILIDADE
  const isTrialing = guardStatus.status === 'trial';
  const isActive = guardStatus.status === 'full_access' || guardStatus.status === 'admin';
  const isCanceled = guardStatus.subscription_data?.subscription_status === 'canceled';
  const hasAccess = guardStatus.status === 'admin' || guardStatus.status === 'full_access' || guardStatus.status === 'trial';
  const daysUntilTrialEnd = guardStatus.status === 'trial' ? guardStatus.days_left : null;

  console.log('🎯 GUARD: Status final calculado:', {
    status: guardStatus.status,
    days_left: guardStatus.days_left,
    hours_left: guardStatus.hours_left,
    has_access: hasAccess,
    isTrialing,
    isActive,
    loading: guardStatus.loading
  });

  return {
    ...guardStatus,
    // Propriedades de compatibilidade para componentes existentes
    subscriptionStatus: guardStatus.subscription_data,
    isTrialing,
    isActive,
    isCanceled,
    hasAccess,
    daysUntilTrialEnd,
    refetch: fetchAndCalculateStatus,
  } as any; // Type assertion para compatibilidade
};