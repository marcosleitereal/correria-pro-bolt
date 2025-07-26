import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Plan } from '../types/database';
import { toast } from 'sonner';

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setPlans(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err);
      setError(err.message || 'Erro ao carregar planos');
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId: string, planData: Partial<Plan>): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('plans')
        .update(planData)
        .eq('id', planId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setPlans(prev => prev.map(plan => 
        plan.id === planId ? data : plan
      ));
      toast.success('Plano atualizado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar plano:', err);
      setError(err.message || 'Erro ao atualizar plano');
      toast.error('Erro ao atualizar plano');
      return false;
    }
  };

  const createPlan = async (planData: Partial<Plan>): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('plans')
        .insert(planData)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setPlans(prev => [...prev, data]);
      return true;
    } catch (err: any) {
      console.error('Erro ao criar plano:', err);
      setError(err.message || 'Erro ao criar plano');
      return false;
    }
  };

  const deletePlan = async (planId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (deleteError) {
        throw deleteError;
      }

      setPlans(prev => prev.filter(plan => plan.id !== planId));
      return true;
    } catch (err: any) {
      console.error('Erro ao excluir plano:', err);
      setError(err.message || 'Erro ao excluir plano');
      return false;
    }
  };

  const getActivePlans = (): Plan[] => {
    return plans.filter(plan => plan.is_active);
  };

  const getPlanById = (planId: string): Plan | undefined => {
    return plans.find(plan => plan.id === planId);
  };

  return {
    plans,
    loading,
    error,
    updatePlan,
    createPlan,
    deletePlan,
    getActivePlans,
    getPlanById,
    refetch: fetchPlans,
  };
};