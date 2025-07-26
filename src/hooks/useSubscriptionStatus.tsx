import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface SubscriptionStatus {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'coach' | 'admin' | null;
  subscription_status: 'trialing' | 'active' | 'canceled' | null;
  plan_name: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  has_access: boolean | null;
}

export const useSubscriptionStatus = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setSubscriptionStatus(null);
      setLoading(false);
      return;
    }

    fetchSubscriptionStatus();
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_subscription_status')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setSubscriptionStatus(data);
    } catch (err: any) {
      console.error('Erro ao carregar status da assinatura:', err);
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