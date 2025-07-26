import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface AuditLog {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  details: Record<string, any>;
}

interface AuditLogFilters {
  actor_email?: string;
  action?: string;
  start_date?: Date;
  end_date?: Date;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    fetchLogs();
  }, [user]);

  const fetchLogs = async (filters: AuditLogFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Limitar a 100 registros mais recentes

      // Aplicar filtros
      if (filters.actor_email) {
        query = query.ilike('actor_email', `%${filters.actor_email}%`);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString());
      }

      if (filters.end_date) {
        const endOfDay = new Date(filters.end_date);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar logs de auditoria:', err);
      setError(err.message || 'Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string): string => {
    const actionLabels: Record<string, string> = {
      'USER_LOGIN': 'Login do Usuário',
      'USER_LOGOUT': 'Logout do Usuário',
      'USER_ROLE_UPDATED': 'Função de Usuário Atualizada',
      'RUNNER_CREATED': 'Corredor Criado',
      'RUNNER_UPDATED': 'Corredor Atualizado',
      'RUNNER_DELETED': 'Corredor Excluído',
      'TRAINING_CREATED': 'Treino Criado',
      'TRAINING_UPDATED': 'Treino Atualizado',
      'TRAINING_DELETED': 'Treino Excluído',
      'PLAN_UPDATED': 'Plano Atualizado',
      'GATEWAY_UPDATED': 'Gateway de Pagamento Atualizado',
      'AI_PROVIDER_UPDATED': 'Provedor de IA Atualizado',
      'AI_SETTINGS_UPDATED': 'Configurações de IA Atualizadas'
    };

    return actionLabels[action] || action;
  };

  const getUniqueActions = (): string[] => {
    const actions = [...new Set(logs.map(log => log.action))];
    return actions.sort();
  };

  const getUniqueActors = (): string[] => {
    const actors = [...new Set(logs.map(log => log.actor_email).filter(Boolean))];
    return actors.sort();
  };

  return {
    logs,
    loading,
    error,
    fetchLogs,
    getActionLabel,
    getUniqueActions,
    getUniqueActors,
    refetch: () => fetchLogs(),
  };
};