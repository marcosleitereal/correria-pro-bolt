import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'coach' | 'admin';
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const { user, session } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError(err.message || 'Erro ao carregar usuários');
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    if (!session?.access_token) {
      setError('Sessão não encontrada');
      toast.error('Erro de autenticação');
      return false;
    }

    // Verificar se a URL do Supabase está configurada
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      const errorMsg = 'VITE_SUPABASE_URL não está configurado. Verifique o arquivo .env na raiz do projeto.';
      setError(errorMsg);
      toast.error('Erro de configuração');
      console.error('Erro de configuração:', errorMsg);
      return false;
    }

    setCreating(true);
    try {
      setError(null);

      const apiUrl = `${supabaseUrl}/functions/v1/create-user`;
      
      console.log('Tentando chamar Edge Function:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      // Atualizar lista local
      await fetchUsers();
      
      toast.success('Treinador criado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Erro ao criar usuário');
      toast.error('Erro ao criar usuário');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!session?.access_token) {
      setError('Sessão não encontrada');
      toast.error('Erro de autenticação');
      return false;
    }

    // Verificar se a URL do Supabase está configurada
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      const errorMsg = 'VITE_SUPABASE_URL não está configurado. Verifique o arquivo .env na raiz do projeto.';
      setError(errorMsg);
      toast.error('Erro de configuração');
      console.error('Erro de configuração:', errorMsg);
      return false;
    }

    setDeleting(prev => ({ ...prev, [userId]: true }));
    try {
      setError(null);

      const apiUrl = `${supabaseUrl}/functions/v1/delete-user`;
      
      console.log('Tentando chamar Edge Function:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir usuário');
      }

      // Forçar logout se o usuário excluído for o atual (não deveria acontecer, mas por segurança)
      if (userId === user?.id) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return true;
      }

      // Atualizar lista local
      await fetchUsers();
      
      toast.success('Treinador excluído com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      setError(err.message || 'Erro ao excluir usuário');
      toast.error(err.message || 'Erro ao excluir usuário');
      return false;
    } finally {
      setDeleting(prev => ({ ...prev, [userId]: false }));
    }
  };

  const forceLogoutDeletedUser = async (userEmail: string): Promise<boolean> => {
    try {
      // Invalidar todas as sessões do usuário excluído
      // Isso força o logout em todas as abas/dispositivos
      const { error } = await supabase.auth.admin.deleteUser(
        userEmail,
        true // shouldSoftDelete = false (exclusão permanente)
      );

      if (error) {
        console.error('Erro ao forçar logout do usuário excluído:', error);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('Erro ao forçar logout:', err);
      return false;
    }
  };

  const clearUserSession = async (userId: string): Promise<void> => {
    try {
      // Se o usuário excluído for o atual, fazer logout imediato
      if (userId === user?.id) {
        console.log('🚨 Usuário atual foi excluído, fazendo logout forçado...');
        await supabase.auth.signOut();
        
        // Limpar localStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirecionar para login
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Erro ao limpar sessão:', err);
    }
  };

  const refreshUserList = async (): Promise<void> => {
    try {
      // Recarregar lista de usuários após exclusão
      await fetchUsers();
      
      // Verificar se o usuário atual ainda existe
      if (user) {
        const currentUserExists = users.some(u => u.id === user.id);
        if (!currentUserExists) {
          console.log('🚨 Usuário atual não encontrado na lista, fazendo logout...');
          await clearUserSession(user.id);
        }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar lista de usuários:', err);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'coach' | 'admin'): Promise<boolean> => {
    if (!session?.access_token) {
      setError('Sessão não encontrada');
      toast.error('Erro de autenticação');
      return false;
    }

    // Verificar se a URL do Supabase está configurada
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      const errorMsg = 'VITE_SUPABASE_URL não está configurado. Verifique o arquivo .env na raiz do projeto.';
      setError(errorMsg);
      toast.error('Erro de configuração');
      console.error('Erro de configuração:', errorMsg);
      return false;
    }

    try {
      setError(null);

      const apiUrl = `${supabaseUrl}/functions/v1/update-user-role`;
      
      console.log('Tentando chamar Edge Function:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          new_role: newRole
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar função do usuário');
      }

      // Atualizar estado local
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      if (data.no_change) {
        toast.info('Usuário já possui esta função');
      } else {
        toast.success('Função do usuário atualizada com sucesso!');
      }

      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar função do usuário:', err);
      setError(err.message || 'Erro ao atualizar função do usuário');
      toast.error('Erro ao atualizar função do usuário');
      return false;
    }
  };

  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      'coach': 'Treinador',
      'admin': 'Administrador'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string): string => {
    const roleColors: Record<string, string> = {
      'coach': 'bg-blue-100 text-blue-700',
      'admin': 'bg-red-100 text-red-700'
    };
    return roleColors[role] || 'bg-slate-100 text-slate-700';
  };

  return {
    users,
    loading,
    error,
    creating,
    deleting,
    createUser,
    deleteUser,
    updateUserRole,
    getRoleLabel,
    getRoleColor,
    refetch: fetchUsers,
  };
};