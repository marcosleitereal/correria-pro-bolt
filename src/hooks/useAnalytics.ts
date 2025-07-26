import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface PlatformAnalytics {
  totalCoaches: number;
  newCoachesToday: number;
  totalAthletes: number;
  totalTrainingsGenerated: number;
  monthlyRecurringRevenue: number;
  planDistribution: Array<{
    name: string;
    value: number;
    price: number;
  }>;
  trainingsLast30Days: Array<{
    date: string;
    count: number;
  }>;
  generatedAt: string;
}

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuthContext();

  useEffect(() => {
    if (!user || !session) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [user, session]);

  const fetchAnalytics = async () => {
    if (!session?.access_token) {
      setError('Sessão não encontrada');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Buscando analytics da plataforma...');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-platform-analytics`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar analytics');
      }

      console.log('✅ Analytics carregados com sucesso:', data);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Erro ao carregar analytics:', err);
      setError(err.message || 'Erro ao carregar dados de analytics');
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return {
    analytics,
    loading,
    error,
    formatCurrency,
    formatDate,
    refetch: fetchAnalytics,
  };
};