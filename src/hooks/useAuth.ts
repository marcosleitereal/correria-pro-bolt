import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
        // Clear local auth state if session is invalid
        clearUserLocally();
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
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
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