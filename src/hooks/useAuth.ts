import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        // Clear invalid session from local storage
        await signOut();
        return;
      }
      
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('🚀 AUTH: Iniciando processo de cadastro para:', email);
    
    try {
      const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    console.log('📊 AUTH: Resposta do Supabase signUp:', { data, error });
    
    // Tratar erro específico de usuário já existente
    if (error && error.message === 'User already registered') {
      return { 
        data, 
        error: { 
          ...error, 
          message: 'Este email já está cadastrado. Faça login ou use outro email.' 
        } 
      };
    }

    // Se o cadastro foi bem-sucedido, aguardar um momento para o trigger processar
    if (data.user && !error) {
      console.log('✅ AUTH: Usuário criado com sucesso, aguardando processamento do trigger...');
      // Aguardar 2 segundos para o trigger handle_new_user processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o perfil foi criado
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', data.user.id)
        .maybeSingle();
      
      console.log('🔍 AUTH: Verificação de perfil criado:', { profileCheck, profileError });
      
      if (!profileCheck && !profileError) {
        console.log('⚠️ AUTH: Perfil não foi criado pelo trigger, criando manualmente...');
        
        // Criar perfil manualmente se o trigger falhou
        const { error: manualProfileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            email: email,
            role: 'coach'
          });
        
        if (manualProfileError) {
          console.error('❌ AUTH: Erro ao criar perfil manualmente:', manualProfileError);
        } else {
          console.log('✅ AUTH: Perfil criado manualmente com sucesso');
        }
      }
    }

    return { data, error };
    } catch (err: any) {
      console.error('❌ AUTH: Erro crítico no signUp:', err);
      return { 
        data: null, 
        error: { message: 'Erro de conexão. Verifique sua internet e tente novamente.' } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // CRÍTICO: Verificar se o Supabase está configurado
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase não está configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify.');
      }

      if (!supabase || typeof supabase.auth?.signInWithPassword !== 'function') {
        throw new Error('Cliente Supabase não está funcionando corretamente.');
      }

      console.log('🔐 AUTH: Tentando fazer login para:', email);
      
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

      console.log('📊 AUTH: Resposta do login:', { data: !!data, error });
      
      if (error) {
        // Tratar erros específicos do Supabase
        if (error.message.includes('Invalid login credentials')) {
          return { 
            data, 
            error: { 
              ...error, 
              message: 'Email ou senha incorretos. Verifique suas credenciais.' 
            } 
          };
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          return { 
            data, 
            error: { 
              ...error, 
              message: 'Erro de conexão. Verifique sua internet e as configurações do Supabase.' 
            } 
          };
        }
      }
      
    return { data, error };
    } catch (err: any) {
      console.error('❌ AUTH: Erro crítico no signIn:', err);
      
      let errorMessage = 'Erro de conexão. Tente novamente.';
      
      if (err.message && err.message.includes('Supabase não está configurado')) {
        errorMessage = 'Erro de configuração do sistema. Contate o suporte.';
      } else if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      return { 
        data: null, 
        error: { message: errorMessage } 
      };
    }
  };

  const signOut = async () => {
    // Clear local state immediately to prevent further requests with invalid token
    clearUserLocally();
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const clearUserLocally = () => {
    setAuthState({
      user: null,
      session: null,
      loading: false,
    });
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { data, error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};