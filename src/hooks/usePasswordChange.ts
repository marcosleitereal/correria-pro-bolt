import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface PasswordChangeData {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

export const usePasswordChange = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const hasPassword = (): boolean => {
    // Verificar se o usuário tem senha (não é social login)
    // Usuários do Google/social providers não têm app_metadata.provider como 'email'
    return user?.app_metadata?.provider === 'email' || 
           user?.app_metadata?.providers?.includes('email') ||
           false;
  };

  const validatePasswords = (data: PasswordChangeData): string | null => {
    if (!data.newPassword) {
      return 'Nova senha é obrigatória';
    }

    if (data.newPassword.length < 6) {
      return 'Nova senha deve ter pelo menos 6 caracteres';
    }

    if (data.newPassword !== data.confirmPassword) {
      return 'As senhas não coincidem';
    }

    // Se o usuário já tem senha, validar senha atual
    if (hasPassword() && !data.currentPassword) {
      return 'Senha atual é obrigatória';
    }

    return null;
  };

  const changePassword = async (data: PasswordChangeData): Promise<boolean> => {
    if (!user) {
      setError('Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    // Validar dados
    const validationError = validatePasswords(data);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return false;
    }

    setLoading(true);
    setError(null);
    toast.loading('Alterando senha...', { id: 'password-change' });

    try {
      // Se o usuário já tem senha, verificar senha atual primeiro
      if (hasPassword() && data.currentPassword) {
        // Tentar fazer login com a senha atual para verificar
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email!,
          password: data.currentPassword
        });

        if (signInError) {
          throw new Error('Senha atual incorreta');
        }
      }

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Senha alterada com sucesso!', { id: 'password-change' });
      return true;
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      const errorMessage = err.message || 'Erro ao alterar senha';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'password-change' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    changePassword,
    hasPassword,
    loading,
    error,
  };
};