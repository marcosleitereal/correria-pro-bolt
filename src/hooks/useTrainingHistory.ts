import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface TrainingHistoryFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  styleId?: string;
  searchTerm?: string;
}

interface TrainingWithFeedback {
  id: string;
  title: string;
  content: any;
  status: string;
  created_at: string;
  updated_at: string;
  style_id: string;
  athlete_feedback: {
    id: string;
    rating: number;
    feedback_text: string;
    created_at: string;
    updated_at: string;
  } | null;
}

export const useTrainingHistory = (runnerId?: string) => {
  const [trainings, setTrainings] = useState<TrainingWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  // ARQUITETURA ROBUSTA: Função de busca estabilizada com useCallback
  const fetchTrainingHistory = useCallback(async (filters: TrainingHistoryFilters = {}) => {
    // CLÁUSULA DE PROTEÇÃO: Não executar se parâmetros essenciais não existirem
    if (!runnerId || !user) {
      console.log('🛡️ useTrainingHistory: Proteção ativada - runnerId ou user ausente');
      setTrainings([]);
      setLoading(false);
      return;
    }

    console.log('🔍 useTrainingHistory: Buscando histórico para runner:', runnerId, 'com filtros:', filters);
    
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ useTrainingHistory: Supabase não configurado');
        throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      }

      console.log('✅ useTrainingHistory: Supabase configurado, iniciando query...');
      
      // Query base com LEFT JOIN para buscar feedback junto com treinos
      let query = supabase
        .from('trainings')
        .select(`
          id,
          title,
          content,
          status,
          created_at,
          updated_at,
          style_id,
          runner_id,
          group_id,
          public_feedback_token,
          athlete_feedback:athlete_feedback!training_id (
            id,
            rating,
            feedback_text,
            created_at,
            updated_at
          )
        `)
        .eq('runner_id', runnerId)
        .eq('status', 'enviado')
        .order('created_at', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
        console.log('🗓️ useTrainingHistory: Filtro data inicial aplicado:', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
        console.log('🗓️ useTrainingHistory: Filtro data final aplicado:', endOfDay.toISOString());
      }

      if (filters.searchTerm) {
        query = query.ilike('title', `%${filters.searchTerm}%`);
        console.log('🔍 useTrainingHistory: Filtro busca aplicado:', filters.searchTerm);
      }

      if (filters.styleId) {
        query = query.eq('style_id', filters.styleId);
        console.log('🎯 useTrainingHistory: Filtro estilo aplicado:', filters.styleId);
      }

      console.log('📊 useTrainingHistory: Executando query para runner_id:', runnerId);

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('❌ useTrainingHistory: Erro na query do Supabase:', fetchError);
        throw fetchError;
      }

      console.log('✅ useTrainingHistory: Dados recebidos do Supabase:', data?.length || 0, 'treinos');

      // Processar dados para garantir formato correto
      const processedTrainings = (data || []).map(training => ({
        ...training,
        athlete_feedback: Array.isArray(training.athlete_feedback) && training.athlete_feedback.length > 0 
          ? training.athlete_feedback[0] 
          : null
      }));

      setTrainings(processedTrainings);
      console.log('✅ useTrainingHistory: Estado atualizado com', processedTrainings.length, 'treinos');
    } catch (err: any) {
      console.error('❌ useTrainingHistory: Erro ao buscar histórico:', err);
      
      let errorMessage = '';
      
      // Tratamento específico para diferentes tipos de erro
      if (err.message && err.message.includes('Failed to fetch')) {
        console.warn('⚠️ useTrainingHistory: Falha de conectividade detectada');
        errorMessage = 'Sem conexão com o servidor. Verifique sua internet ou configurações do Supabase.';
      } else if (err.message && err.message.includes('Supabase não está configurado')) {
        errorMessage = 'Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.';
        toast.error('Erro de configuração do sistema');
      } else if (err.code === '42P01') {
        errorMessage = 'Tabela de treinos não encontrada no banco de dados.';
        toast.error('Erro de estrutura do banco de dados');
      } else {
        errorMessage = err.message || 'Erro desconhecido ao carregar histórico';
        toast.error('Erro ao carregar histórico de treinos');
      }
      
      setError(errorMessage);
      setTrainings([]);
    } finally {
      setLoading(false);
      console.log('🏁 useTrainingHistory: Busca de histórico finalizada');
    }
  }, [runnerId, user]); // DEPENDÊNCIAS ESTÁVEIS: Apenas runnerId e user

  // Função para salvar feedback
  const saveFeedback = useCallback(async (trainingId: string, feedbackText: string, rating: number): Promise<boolean> => {
    try {
      console.log('💾 useTrainingHistory: Salvando feedback para treino:', trainingId);
      
      const { data, error } = await supabase
        .from('athlete_feedback')
        .upsert({
          training_id: trainingId,
          athlete_name: 'Atleta', // Nome padrão
          rating,
          feedback_text: feedbackText
        })
        .select()
        .single();

      if (error) {
        console.error('❌ useTrainingHistory: Erro ao salvar feedback:', error);
        throw error;
      }

      console.log('✅ useTrainingHistory: Feedback salvo com sucesso:', data);
      
      // Atualizar estado local
      setTrainings(prev => prev.map(training => 
        training.id === trainingId 
          ? { ...training, athlete_feedback: data }
          : training
      ));
      
      toast.success('Feedback salvo com sucesso!');
      return true;
    } catch (err: any) {
      console.error('❌ useTrainingHistory: Erro ao salvar feedback:', err);
      toast.error('Erro ao salvar feedback');
      return false;
    }
  }, []);

  return {
    trainings,
    loading,
    error,
    runnerId, // Retornar o runnerId para uso no componente
    fetchTrainingHistory,
    saveFeedback,
  };
};