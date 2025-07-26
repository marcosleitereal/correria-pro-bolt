import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { TrainingGroup } from '../types/database';
import { toast } from 'sonner';

export const useTrainingGroups = () => {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('training_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setGroups(data || []);
    } catch (err: any) {
      console.error('Error fetching training groups:', err);
      setError(err.message || 'Erro ao carregar grupos de treino');
      toast.error('Erro ao carregar grupos de treino');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupData: Partial<TrainingGroup>): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      setError(null);

      const { data, error: createError } = await supabase
        .from('training_groups')
        .insert({
          ...groupData,
          coach_id: user.id
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setGroups(prev => [data, ...prev]);
      toast.success('Grupo criado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error creating training group:', err);
      setError(err.message || 'Erro ao criar grupo de treino');
      toast.error('Erro ao criar grupo de treino');
      return false;
    }
  };

  const updateGroup = async (groupId: string, groupData: Partial<TrainingGroup>): Promise<boolean> => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('training_groups')
        .update(groupData)
        .eq('id', groupId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setGroups(prev => prev.map(group => 
        group.id === groupId ? data : group
      ));
      toast.success('Grupo atualizado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error updating training group:', err);
      setError(err.message || 'Erro ao atualizar grupo de treino');
      toast.error('Erro ao atualizar grupo de treino');
      return false;
    }
  };

  const deleteGroup = async (groupId: string): Promise<boolean> => {
    try {
      setError(null);

      // First delete all memberships
      const { error: deleteMembershipsError } = await supabase
        .from('runner_group_memberships')
        .delete()
        .eq('group_id', groupId);

      if (deleteMembershipsError) {
        throw deleteMembershipsError;
      }

      // Then delete the group
      const { error: deleteError } = await supabase
        .from('training_groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) {
        throw deleteError;
      }

      setGroups(prev => prev.filter(group => group.id !== groupId));
      toast.success('Grupo excluído com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Error deleting training group:', err);
      setError(err.message || 'Erro ao excluir grupo de treino');
      toast.error('Erro ao excluir grupo de treino');
      return false;
    }
  };

  const getGroupById = (groupId: string): TrainingGroup | undefined => {
    return groups.find(group => group.id === groupId);
  };

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    refetch: fetchGroups,
  };
};