import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

export const useFeedbackCompletionRate = () => {
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setCompletionRate(0);
      setLoading(false);
      return;
    }

    fetchCompletionRate();
  }, [user]);

  const fetchCompletionRate = async () => {
    try {
      console.log('📊 Calculando taxa de conclusão baseada em feedback para coach:', user?.id);
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.rpc !== 'function') {
        throw new Error('Supabase não está configurado corretamente');
      }

      // Chamar função do banco para calcular taxa de conclusão
      const { data, error: rpcError } = await supabase.rpc(
        'calculate_feedback_completion_rate',
        { coach_id_param: user?.id }
      );

      if (rpcError) {
        console.error('❌ Erro na função RPC:', rpcError);
        throw rpcError;
      }

      const rate = Number(data) || 0;
      console.log('✅ Taxa de conclusão calculada:', rate + '%');
      
      setCompletionRate(rate);
    } catch (err: any) {
      console.error('❌ Erro ao calcular taxa de conclusão:', err);
      
      let errorMessage = '';
      
      if (err.message && err.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conectividade. Verifique sua conexão.';
      } else if (err.message && err.message.includes('Supabase não está configurado')) {
        errorMessage = 'Configuração do Supabase não encontrada.';
      } else {
        errorMessage = err.message || 'Erro ao calcular taxa de conclusão';
      }
      
      setError(errorMessage);
      setCompletionRate(0); // Valor padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const getEngagementLevel = (rate: number): string => {
    if (rate >= 80) return 'Excelente';
    if (rate >= 60) return 'Bom';
    if (rate >= 40) return 'Regular';
    if (rate >= 20) return 'Baixo';
    return 'Muito Baixo';
  };

  const getEngagementColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    if (rate >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEngagementMessage = (rate: number): string => {
    if (rate >= 80) return 'Seus atletas estão muito engajados!';
    if (rate >= 60) return 'Bom nível de engajamento dos atletas';
    if (rate >= 40) return 'Engajamento moderado, pode melhorar';
    if (rate >= 20) return 'Baixo engajamento, incentive feedback';
    return 'Muito baixo engajamento, revise estratégia';
  };

  return {
    completionRate,
    loading,
    error,
    getEngagementLevel,
    getEngagementColor,
    getEngagementMessage,
    refetch: fetchCompletionRate,
  };
};