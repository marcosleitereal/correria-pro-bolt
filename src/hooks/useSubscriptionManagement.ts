import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface CoachSubscription {
  user_id: string;
  full_name: string | null;
  email: string | null;
  subscription_status: string | null;
  current_plan_name: string | null;
  plan_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  has_access: boolean | null;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  max_athletes: number;
  is_publicly_listed: boolean;
  is_active: boolean;
}

export const useSubscriptionManagement = () => {
  const [coaches, setCoaches] = useState<CoachSubscription[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const { user, session } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setCoaches([]);
      setAllPlans([]);
      setLoading(false);
      return;
    }

    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todos os treinadores com suas assinaturas
      const { data: coachesData, error: coachesError } = await supabase
        .from('user_subscription_details')
        .select('*')
        .order('full_name', { ascending: true });

      if (coachesError) {
        throw coachesError;
      }

      // Buscar todos os planos (incluindo não públicos)
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (plansError) {
        throw plansError;
      }

      setCoaches(coachesData || []);
      setAllPlans(plansData || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados de assinatura:', err);
      setError(err.message || 'Erro ao carregar dados de assinatura');
      toast.error('Erro ao carregar dados de assinatura');
    } finally {
      setLoading(false);
    }
  };

  const assignPlan = async (userId: string, planId: string): Promise<boolean> => {
    if (!session?.access_token) {
      setError('Sessão não encontrada');
      toast.error('Erro de autenticação');
      return false;
    }

    setAssigning(prev => ({ ...prev, [userId]: true }));

    try {
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-plan`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          new_plan_id: planId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atribuir plano');
      }

      // Atualizar dados locais
      await fetchData();
      
      toast.success('Plano atribuído com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro ao atribuir plano:', err);
      setError(err.message || 'Erro ao atribuir plano');
      toast.error('Erro ao atribuir plano');
      return false;
    } finally {
      setAssigning(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getStatusLabel = (status: string | null): string => {
    const statusLabels: Record<string, string> = {
      'trialing': 'Período de Teste',
      'active': 'Ativo',
      'canceled': 'Cancelado',
      'past_due': 'Pagamento em Atraso',
      'incomplete': 'Incompleto'
    };
    return statusLabels[status || ''] || 'Sem Assinatura';
  };

  const getStatusColor = (status: string | null): string => {
    const statusColors: Record<string, string> = {
      'trialing': 'bg-blue-100 text-blue-700',
      'active': 'bg-green-100 text-green-700',
      'canceled': 'bg-red-100 text-red-700',
      'past_due': 'bg-yellow-100 text-yellow-700',
      'incomplete': 'bg-orange-100 text-orange-700'
    };
    return statusColors[status || ''] || 'bg-slate-100 text-slate-700';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPublicPlans = (): Plan[] => {
    return allPlans.filter(plan => plan.is_active && plan.is_public);
  };

  const getAdminOnlyPlans = (): Plan[] => {
    return allPlans.filter(plan => 
      plan.is_active && 
      !plan.is_public
    );
  };

  return {
    coaches,
    allPlans,
    loading,
    error,
    assigning,
    assignPlan,
    getStatusLabel,
    getStatusColor,
    formatPrice,
    getPublicPlans,
    getAdminOnlyPlans,
    refetch: fetchData,
  };
};