import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { Runner } from '../types/database';
import { toast } from 'sonner';

export const useRunners = () => {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setRunners([]);
      setLoading(false);
      return;
    }

    fetchRunners();
  }, [user]);

  const fetchRunners = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase não está configurado corretamente. Verifique as variáveis de ambiente.');
      }

      // Buscar TODOS os corredores (ativos e arquivados) para permitir alternância de visualização
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setRunners(data || []);
    } catch (err: any) {
      console.error('Error fetching runners:', err);
      const errorMessage = err.message || 'Erro ao carregar corredores';
      setError(errorMessage);
      
      if (errorMessage.includes('Supabase não está configurado')) {
        toast.error('Erro de configuração: Verifique as credenciais do Supabase');
      } else {
        toast.error('Erro ao carregar corredores');
      }
    } finally {
      setLoading(false);
    }
  };

  const createRunner = async (runnerData: Partial<Runner>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('runners')
        .insert({
          ...runnerData,
          coach_id: user.id
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setRunners(prev => [data, ...prev]);
      toast.success('Corredor criado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error creating runner:', err);
      setError(err.message || 'Erro ao criar corredor');
      toast.error('Erro ao criar corredor');
      return false;
    }
  };

  const updateRunner = async (runnerId: string, runnerData: Partial<Runner>): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('runners')
        .update(runnerData)
        .eq('id', runnerId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setRunners(prev => prev.map(runner => 
        runner.id === runnerId ? data : runner
      ));
      toast.success('Corredor atualizado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error updating runner:', err);
      setError(err.message || 'Erro ao atualizar corredor');
      toast.error('Erro ao atualizar corredor');
      return false;
    }
  };

  const archiveRunner = async (runnerId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: archiveError } = await supabase
        .from('runners')
        .update({ is_archived: true })
        .eq('id', runnerId);

      if (archiveError) {
        throw archiveError;
      }

      setRunners(prev => prev.filter(runner => runner.id !== runnerId));
      toast.success('Corredor arquivado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error archiving runner:', err);
      setError(err.message || 'Erro ao arquivar corredor');
      toast.error('Erro ao arquivar corredor');
      return false;
    }
  };

  const unarchiveRunner = async (runnerId: string): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: unarchiveError } = await supabase
        .from('runners')
        .update({ is_archived: false })
        .eq('id', runnerId)
        .select()
        .single();

      if (unarchiveError) {
        throw unarchiveError;
      }

      // Atualizar a lista local
      setRunners(prev => prev.map(runner => 
        runner.id === runnerId ? data : runner
      ));
      
      toast.success('Corredor desarquivado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error unarchiving runner:', err);
      setError(err.message || 'Erro ao desarquivar corredor');
      toast.error('Erro ao desarquivar corredor');
      return false;
    }
  };

  const getRunnerById = (runnerId: string): Runner | undefined => {
    return runners.find(runner => runner.id === runnerId);
  };

  return {
    runners,
    loading,
    error,
    createRunner,
    updateRunner,
    archiveRunner,
    unarchiveRunner,
    getRunnerById,
    refetch: fetchRunners,
  };
};