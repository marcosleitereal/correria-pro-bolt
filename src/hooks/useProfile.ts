import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'coach' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('useProfile: Iniciando busca de dados para o perfil do usuário...');
      
      // VALIDAÇÃO CRÍTICA DE SEGURANÇA: Verificar se o usuário está autenticado
      if (!user || !user.id) {
        console.error('🚨 ERRO CRÍTICO DE SEGURANÇA: Tentativa de buscar perfil sem usuário autenticado');
        setError('Usuário não autenticado');
        setProfile(null);
        setLoading(false);
        return;
      }
      
      // Verificar se o Supabase está configurado
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('🚨 ERRO: Supabase não está configurado corretamente');
        setError('Supabase não configurado. Verifique as variáveis de ambiente.');
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('useProfile: ID do usuário autenticado:', user.id);
      setLoading(true);
      setError(null);

      // Dar perfil admin para o usuário dev
      if (user?.email === 'dev@sonnik.com.br') {
        const devProfile = {
          id: user.id,
          full_name: 'Desenvolvedor Admin',
          email: user.email,
          role: 'admin' as const,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('useProfile: Perfil dev configurado:', devProfile);
        setProfile(devProfile);
        setLoading(false);
        return;
      }

      // CORREÇÃO CRÍTICA: Query com filtro rigoroso por ID do usuário autenticado
      console.log('🔒 SEGURANÇA: Buscando perfil APENAS para o usuário ID:', user.id);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (fetchError) {
        console.error('🚨 useProfile: ERRO CRÍTICO ao buscar perfil para usuário', user.id, ':', fetchError);
        throw fetchError;
      }

      // Se não encontrou perfil, define como null sem erro
      if (!data) {
        console.log('⚠️ useProfile: Nenhum perfil encontrado para o usuário:', user.id);
        setProfile(null);
        setLoading(false);
        return;
      }

      // VALIDAÇÃO PÓS-QUERY: Verificar se o perfil retornado pertence ao usuário correto
      if (data && data.id !== user.id) {
        console.error('🚨 VAZAMENTO DE DADOS DETECTADO: Perfil retornado não pertence ao usuário autenticado!');
        console.error('🚨 ID esperado:', user.id, 'ID recebido:', data.id);
        throw new Error('ERRO CRÍTICO DE SEGURANÇA: Dados de outro usuário foram retornados');
      }
      
      console.log('✅ useProfile: Dados do perfil validados e seguros para usuário:', user.id);
      setProfile(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar perfil';
      console.error('🚨 useProfile: ERRO capturado:', errorMessage);
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('Erro de conectividade. Verifique sua conexão e as configurações do Supabase.');
      } else {
        setError(errorMessage);
      }
      setProfile(null); // CRÍTICO: Limpar dados em caso de erro
    } finally {
      setLoading(false);
      console.log('🔒 useProfile: Busca de perfil finalizada com segurança');
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMessage = err.message || 'Erro ao atualizar perfil';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
};