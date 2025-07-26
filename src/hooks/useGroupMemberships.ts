import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface GroupMembership {
  id: string;
  runner_id: string;
  group_id: string;
  joined_at: string;
}

export const useGroupMemberships = () => {
  const [memberships, setMemberships] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }

    fetchMemberships();
  }, [user]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('runner_group_memberships')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      setMemberships(data || []);
    } catch (err: any) {
      console.error('Error fetching group memberships:', err);
      setError(err.message || 'Erro ao carregar membros dos grupos');
    } finally {
      setLoading(false);
    }
  };

  const getGroupMembers = (groupId: string): string[] => {
    return memberships
      .filter(membership => membership.group_id === groupId)
      .map(membership => membership.runner_id);
  };

  const getMemberCount = (groupId: string): number => {
    return memberships.filter(membership => membership.group_id === groupId).length;
  };

  const getRunnerGroups = (runnerId: string): string[] => {
    return memberships
      .filter(membership => membership.runner_id === runnerId)
      .map(membership => membership.group_id);
  };

  const updateGroupMemberships = async (groupId: string, runnerIds: string[]): Promise<boolean> => {
    try {
      setError(null);

      // First, remove all existing memberships for this group
      const { error: deleteError } = await supabase
        .from('runner_group_memberships')
        .delete()
        .eq('group_id', groupId);

      if (deleteError) {
        throw deleteError;
      }

      // Then, add the new memberships
      if (runnerIds.length > 0) {
        const newMemberships = runnerIds.map(runnerId => ({
          group_id: groupId,
          runner_id: runnerId
        }));

        const { error: insertError } = await supabase
          .from('runner_group_memberships')
          .insert(newMemberships);

        if (insertError) {
          throw insertError;
        }
      }

      // Refresh memberships
      await fetchMemberships();
      return true;
    } catch (err: any) {
      console.error('Error updating group memberships:', err);
      setError(err.message || 'Erro ao atualizar membros do grupo');
      return false;
    }
  };

  const addRunnerToGroup = async (groupId: string, runnerId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: insertError } = await supabase
        .from('runner_group_memberships')
        .insert({
          group_id: groupId,
          runner_id: runnerId
        });

      if (insertError) {
        throw insertError;
      }

      await fetchMemberships();
      return true;
    } catch (err: any) {
      console.error('Error adding runner to group:', err);
      setError(err.message || 'Erro ao adicionar corredor ao grupo');
      return false;
    }
  };

  const removeRunnerFromGroup = async (groupId: string, runnerId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('runner_group_memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('runner_id', runnerId);

      if (deleteError) {
        throw deleteError;
      }

      await fetchMemberships();
      return true;
    } catch (err: any) {
      console.error('Error removing runner from group:', err);
      setError(err.message || 'Erro ao remover corredor do grupo');
      return false;
    }
  };

  return {
    memberships,
    loading,
    error,
    getGroupMembers,
    getMemberCount,
    getRunnerGroups,
    updateGroupMemberships,
    addRunnerToGroup,
    removeRunnerFromGroup,
    refetch: fetchMemberships,
  };
};