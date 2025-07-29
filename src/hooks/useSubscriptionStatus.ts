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

      console.log('🔍 TRIAL DEBUG: Buscando status da assinatura para usuário:', user?.id);
      console.log('🔍 TRIAL DEBUG: Email do usuário:', user?.email);

      // ACESSO TOTAL PARA DEV
      if (user?.email === 'dev@sonnik.com.br') {
        console.log('👑 TRIAL DEBUG: Usuário dev detectado - acesso total');
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

      // FORÇAR REFRESH DOS DADOS APÓS PAGAMENTO
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        console.log('💳 SUBSCRIPTION STATUS: Session ID detectado, aguardando processamento...');
        // Aguardar um pouco para o webhook processar
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // CORREÇÃO CRÍTICA: Sempre usar valores fixos baseados no admin (35 dias)
      // BUSCAR CONFIGURAÇÕES DINÂMICAS DO BANCO
      const { data: dynamicSettings, error: settingsError } = await supabase
        .from('app_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let trialDurationDays = 70; // Fallback
      let trialAthleteLimit = 70;
      let trialTrainingLimit = 70;
      
      if (!settingsError && dynamicSettings) {
        trialDurationDays = dynamicSettings.trial_duration_days;
        trialAthleteLimit = dynamicSettings.trial_athlete_limit;
        trialTrainingLimit = dynamicSettings.trial_training_limit;
        console.log('✅ SUBSCRIPTION STATUS: Usando configurações dinâmicas do banco:', {
          trial_duration_days: trialDurationDays,
          trial_athlete_limit: trialAthleteLimit,
          trial_training_limit: trialTrainingLimit,
          fonte: 'app_settings dinâmico'
        });
      } else {
        console.warn('⚠️ SUBSCRIPTION STATUS: Usando valores fallback:', {
          trial_duration_days: trialDurationDays,
          trial_athlete_limit: trialAthleteLimit,
          trial_training_limit: trialTrainingLimit,
          erro: settingsError?.message
        });
      }
      


      // 1. BUSCAR PERFIL DO USUÁRIO
      console.log('📊 TRIAL DEBUG: Buscando perfil do usuário...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ TRIAL DEBUG: Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      // Se não há perfil, retornar estado padrão sem acesso
      if (!profileData) {
        console.log('⚠️ TRIAL DEBUG: Nenhum perfil encontrado para o usuário - definindo acesso como false');
        console.log('🔧 TRIAL DEBUG: Tentando criar perfil automaticamente...');
        
        // Tentar criar perfil automaticamente
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: user.user_metadata?.full_name || null,
            email: user.email,
            role: 'coach'
          }, {
            onConflict: 'id'
          })
          .select('full_name, email, role')
          .single();
        
        if (createProfileError) {
          console.error('❌ TRIAL DEBUG: Erro ao criar perfil automaticamente:', createProfileError);
          setSubscriptionStatus({
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
          });
          setLoading(false);
          return;
        }
        
        console.log('✅ TRIAL DEBUG: Perfil criado automaticamente, usando dados do novo perfil');
        // Usar dados do perfil recém-criado
        const profileToUse = newProfile;
        
        // Continuar com a lógica usando o novo perfil
        console.log('✅ TRIAL DEBUG: Perfil encontrado:', profileToUse);
        
        // 2. BUSCAR ASSINATURA DO USUÁRIO
        console.log('📊 TRIAL DEBUG: Buscando assinatura do usuário...');
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user?.id)
          .maybeSingle();
            console.log('🔧 TRIAL DEBUG: 🔄 Tentando inserção direta...');
        if (subscriptionError) {
          console.error('❌ TRIAL DEBUG: Erro ao buscar assinatura:', subscriptionError);
          throw subscriptionError;
        }
        
        console.log('📊 TRIAL DEBUG: Dados da assinatura encontrados:', subscriptionData);
        
        // Se não há assinatura, criar uma de trial automaticamente
        if (!subscriptionData) {
          console.log('🔧 TRIAL DEBUG: ⚡ CRIANDO TRIAL AUTOMÁTICO FORÇADO com duração de', trialDurationDays, 'dias...');
          
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);
          
          console.log('🔧 TRIAL DEBUG: 🚀 EXECUTANDO UPSERT...');
          const { data: newSubscription, error: createSubError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
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
            console.error('❌ TRIAL DEBUG: Erro ao criar assinatura de trial:', createSubError);
            
            // ÚLTIMO RECURSO: Definir status local mesmo sem salvar no banco
            console.log('🆘 TRIAL DEBUG: ÚLTIMO RECURSO - Definindo trial local');
            const emergencyStatus: SubscriptionStatus = {
              user_id: user.id,
              email: profileData.email,
              full_name: profileData.full_name,
              role: profileData.role,
              subscription_status: 'trialing',
              current_plan_name: null,
              plan_id: null,
              trial_ends_at: trialEndsAt.toISOString(),
              current_period_end: trialEndsAt.toISOString(),
              has_access: true
            };
            
            console.log('🆘 TRIAL DEBUG: Status de emergência definido:', emergencyStatus);
            setSubscriptionStatus(emergencyStatus);
            setLoading(false);
            return;
          } else {
            console.log('✅ TRIAL DEBUG: 🎉 Trial automático criado com SUCESSO:', newSubscription);
            console.log('✅ TRIAL DEBUG: Assinatura de trial criada automaticamente com', trialDurationDays, 'dias');
            
            // Usar a nova assinatura
            const finalStatus: SubscriptionStatus = {
              user_id: user.id,
              email: profileToUse.email,
              full_name: profileToUse.full_name,
              role: profileToUse.role,
              subscription_status: 'trialing',
              current_plan_name: null,
              plan_id: null,
              trial_ends_at: trialEndsAt.toISOString(),
              current_period_end: trialEndsAt.toISOString(),
              has_access: true
            };
            
            console.log('✅ TRIAL DEBUG: Status final com trial automático:', finalStatus);
            setSubscriptionStatus(finalStatus);
            setLoading(false);
            return;
          }
        }
        
        setSubscriptionStatus({
          user_id: user.id,
          email: user.email || null,
          full_name: profileToUse.full_name,
          role: profileToUse.role,
          subscription_status: null,
          current_plan_name: null,
          plan_id: null,
          trial_ends_at: null,
          current_period_end: null,
          has_access: false
        });
        setLoading(false);
        return;
      }

      console.log('✅ TRIAL DEBUG: Perfil encontrado:', profileData);

      // 2. BUSCAR ASSINATURA DO USUÁRIO
      console.log('📊 TRIAL DEBUG: Buscando assinatura do usuário...');
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('❌ TRIAL DEBUG: Erro ao buscar assinatura:', subscriptionError);
        throw subscriptionError;
      }

      console.log('📊 TRIAL DEBUG: Dados da assinatura encontrados:', subscriptionData);
      
      // Se não há assinatura, criar uma de trial automaticamente
      if (!subscriptionData) {
        console.log('🔧 TRIAL DEBUG: CRIANDO TRIAL AUTOMÁTICO FORÇADO com duração de', trialDurationDays, 'dias...');
        console.log('🔧 TRIAL DEBUG: User ID:', user.id);
        console.log('🔧 TRIAL DEBUG: Data atual:', new Date().toISOString());
        
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);
        
        console.log('🔧 TRIAL DEBUG: Data de fim calculada:', trialEndsAt.toISOString());
        console.log('🔧 TRIAL DEBUG: Dias até o fim:', Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        
        const subscriptionToCreate = {
          user_id: user.id,
          plan_id: null,
          status: 'trialing' as const,
          trial_ends_at: trialEndsAt.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt.toISOString()
        };
        
        console.log('🔧 TRIAL DEBUG: Dados da assinatura a ser criada:', subscriptionToCreate);
        
        const { data: newSubscription, error: createSubError } = await supabase
          .from('subscriptions')
          .upsert(subscriptionToCreate, { onConflict: 'user_id' })
          .select()
          .single();
        
        if (createSubError) {
          console.error('❌ TRIAL DEBUG: ERRO CRÍTICO ao criar trial automático:', createSubError);
          console.error('❌ TRIAL DEBUG: Código do erro:', createSubError.code);
          console.error('❌ TRIAL DEBUG: Mensagem do erro:', createSubError.message);
          console.error('❌ TRIAL DEBUG: Detalhes do erro:', createSubError.details);
          
          // Tentar inserção direta se upsert falhar
          console.log('🔧 TRIAL DEBUG: Tentando inserção direta...');
          const { data: directInsert, error: directError } = await supabase
            .from('subscriptions')
            .insert(subscriptionToCreate)
            .select()
            .single();
            
          if (directError) {
            console.error('❌ TRIAL DEBUG: Inserção direta também falhou:', directError);
          } else {
            console.log('✅ TRIAL DEBUG: Inserção direta bem-sucedida:', directInsert);
            // Usar resultado da inserção direta
            const finalStatus: SubscriptionStatus = {
              user_id: user.id,
              email: profileData.email,
              full_name: profileData.full_name,
              role: profileData.role,
              subscription_status: 'trialing',
              current_plan_name: null,
              plan_id: null,
              trial_ends_at: trialEndsAt.toISOString(),
              current_period_end: trialEndsAt.toISOString(),
              has_access: true
            };
            
            console.log('✅ TRIAL DEBUG: Status final com inserção direta:', finalStatus);
            setSubscriptionStatus(finalStatus);
            setLoading(false);
            return;
          }
        } else {
          console.log('✅ TRIAL DEBUG: Trial automático criado com SUCESSO:', newSubscription);
          console.log('✅ TRIAL DEBUG: Duração aplicada:', trialDurationDays, 'dias');
          console.log('✅ TRIAL DEBUG: Status da assinatura:', newSubscription.status);
          console.log('✅ TRIAL DEBUG: Trial termina em:', newSubscription.trial_ends_at);
          
          // Usar a nova assinatura
          const finalStatus: SubscriptionStatus = {
            user_id: user.id,
            email: profileData.email,
            full_name: profileData.full_name,
            role: profileData.role,
            subscription_status: 'trialing',
            current_plan_name: null,
            plan_id: null,
            trial_ends_at: trialEndsAt.toISOString(),
            current_period_end: trialEndsAt.toISOString(),
            has_access: true
          };
          
          console.log('✅ TRIAL DEBUG: Status final CONFIRMADO:', finalStatus);
          setSubscriptionStatus(finalStatus);
          setLoading(false);
          return;
        }
      }

      // 3. BUSCAR NOME DO PLANO SE HOUVER
      let planName = null;
      if (subscriptionData?.plan_id) {
        console.log('📊 TRIAL DEBUG: Buscando nome do plano:', subscriptionData.plan_id);
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('name')
          .eq('id', subscriptionData.plan_id)
          .maybeSingle();

        if (!planError && planData) {
          planName = planData.name;
          console.log('✅ TRIAL DEBUG: Nome do plano encontrado:', planName);
        }
      }

      // 4. CALCULAR HAS_ACCESS
      let hasAccess = false;
      let calculationDetails = '';

      // VERIFICAÇÃO CRÍTICA: Se está no plano restrito, SEMPRE bloquear acesso
      const isRestrictedPlan = planName === 'Restrito' || 
                              planName === 'restrito' ||
                              planName?.toLowerCase().includes('restrito');
      
      if (isRestrictedPlan) {
        console.log('🚫 SUBSCRIPTION STATUS: PLANO RESTRITO DETECTADO - BLOQUEANDO ACESSO');
        hasAccess = false;
        calculationDetails = 'Plano Restrito - Acesso bloqueado';
      } else if (subscriptionData) {
      }
      if (subscriptionData) {
        console.log('🎯 TRIAL DEBUG: Dados da assinatura encontrados:', {
          status: subscriptionData.status,
          trial_ends_at: subscriptionData.trial_ends_at,
          current_period_end: subscriptionData.current_period_end,
          plan_id: subscriptionData.plan_id
        });
        
        if (subscriptionData.status === 'active') {
          hasAccess = true;
          calculationDetails = 'Status ativo';
        } else if (subscriptionData.status === 'trialing' && subscriptionData.trial_ends_at) {
          const trialEndDate = new Date(subscriptionData.trial_ends_at);
          const now = new Date();
          hasAccess = now < trialEndDate;
          const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          calculationDetails = `Trial: ${hasAccess ? 'VÁLIDO' : 'EXPIRADO'} - Dias restantes: ${daysLeft} - Termina em: ${trialEndDate.toLocaleString('pt-BR')}`;
          
          console.log('🎯 TRIAL DEBUG: Cálculo detalhado do trial:', {
            trial_ends_at: subscriptionData.trial_ends_at,
            trialEndDate: trialEndDate.toISOString(),
            now: now.toISOString(),
            hasAccess,
            daysLeft,
            timeUntilEnd: trialEndDate.getTime() - now.getTime()
          });
        } else {
          calculationDetails = `Status: ${subscriptionData.status} - trial_ends_at: ${subscriptionData.trial_ends_at}`;
          console.log('⚠️ TRIAL DEBUG: Status não reconhecido ou trial_ends_at ausente:', {
            status: subscriptionData.status,
            trial_ends_at: subscriptionData.trial_ends_at
          });
        }
      } else {
        calculationDetails = 'Nenhuma assinatura encontrada';
        console.log('⚠️ TRIAL DEBUG: Nenhuma assinatura encontrada para o usuário');
      }

      console.log('🎯 TRIAL DEBUG: Cálculo de acesso:', {
        status: subscriptionData?.status,
        trial_ends_at: subscriptionData?.trial_ends_at,
        plan_name: planName,
        is_restricted_plan: isRestrictedPlan,
        has_access: hasAccess,
        calculation_details: calculationDetails
      });

      // 5. MONTAR OBJETO FINAL
      const finalStatus: SubscriptionStatus = {
        user_id: user.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role,
        subscription_status: subscriptionData?.status || null,
        current_plan_name: planName,
        plan_id: subscriptionData?.plan_id || null,
        trial_ends_at: subscriptionData?.trial_ends_at || null,
        current_period_end: subscriptionData?.current_period_end || null,
        has_access: hasAccess
      };

      console.log('✅ TRIAL DEBUG: Status final calculado:', finalStatus);
      setSubscriptionStatus(finalStatus);
    } catch (err: any) {
      console.error('❌ TRIAL DEBUG: Erro geral:', err);
      setError(err.message || 'Erro ao carregar status da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const isTrialing = subscriptionStatus?.subscription_status === 'trialing';
  const isActive = subscriptionStatus?.subscription_status === 'active';
  const isCanceled = subscriptionStatus?.subscription_status === 'canceled';
  const hasAccess = subscriptionStatus?.has_access === true;

  const daysUntilTrialEnd = subscriptionStatus?.trial_ends_at 
    ? Math.ceil((new Date(subscriptionStatus.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // LOGS FINAIS PARA DEBUG
  console.log('🎯 TRIAL DEBUG: Valores finais do hook:', {
    isTrialing,
    isActive,
    hasAccess,
    daysUntilTrialEnd,
    subscription_status: subscriptionStatus?.subscription_status
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
  };
};