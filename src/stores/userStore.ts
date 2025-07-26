import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'coach' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  fetchProfile: (userId: string) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  setProfile: (profile) => {
    set({ profile, error: null });
  },

  updateProfile: (updates) => {
    const currentProfile = get().profile;
    if (currentProfile) {
      const updatedProfile = { ...currentProfile, ...updates };
      set({ profile: updatedProfile });
    }
  },

  fetchProfile: async (userId: string) => {
    set({ loading: true, error: null });

    // VALIDAÇÃO CRÍTICA DE SEGURANÇA: Verificar se o userId é válido
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('🚨 ERRO CRÍTICO DE SEGURANÇA: userId inválido fornecido para fetchProfile');
      set({ error: 'ID de usuário inválido', loading: false, profile: null });
      return;
    }

    // Verificar se o Supabase está configurado
    if (!supabase || typeof supabase.from !== 'function') {
      console.error('🚨 ERRO: Supabase não está configurado corretamente');
      set({ error: 'Supabase não configurado. Verifique as variáveis de ambiente.', loading: false, profile: null });
      return;
    }

    try {
      // Dar perfil admin para o usuário dev
      if (userId && await isDevUser(userId)) {
        const devProfile: UserProfile = {
          id: userId,
          full_name: 'Desenvolvedor Admin',
          email: 'dev@sonnik.com.br',
          role: 'admin',
          avatar_url: await getExistingAvatar(userId), // Buscar avatar existente
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        set({ profile: devProfile, loading: false });
        return;
      }

      console.log('🔒 SEGURANÇA: Buscando perfil APENAS para o usuário ID:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('🚨 ERRO ao buscar perfil para usuário', userId, ':', error);
        throw error;
      }

      // Se não encontrou perfil, retorna null sem erro
      if (!data) {
        console.log('⚠️ Nenhum perfil encontrado para o usuário:', userId);
        set({ profile: null, loading: false });
        return;
      }

      // VALIDAÇÃO PÓS-QUERY: Verificar se o perfil retornado pertence ao usuário correto
      if (data && data.id !== userId) {
        console.error('🚨 VAZAMENTO DE DADOS DETECTADO no userStore!');
        console.error('🚨 ID esperado:', userId, 'ID recebido:', data.id);
        throw new Error('ERRO CRÍTICO DE SEGURANÇA: Dados de outro usuário foram retornados');
      }

      console.log('✅ userStore: Dados do perfil validados e seguros para usuário:', userId);
      set({ profile: data, loading: false });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar perfil';
      console.error('🚨 userStore: ERRO:', errorMessage);
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        set({ error: 'Erro de conectividade. Verifique sua conexão e as configurações do Supabase.', loading: false });
      } else {
        set({ error: errorMessage, loading: false });
      }
    }
  },

  clearProfile: () => {
    console.log('🧹 SEGURANÇA: Limpando perfil do usuário da memória');
    set({ profile: null, error: null, loading: false });
  },
}));

// Helper function to check if user is dev
async function isDevUser(userId: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    return user.user?.email === 'dev@sonnik.com.br';
  } catch {
    return false;
  }
}

// Helper function to get existing avatar for dev user
async function getExistingAvatar(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.avatar_url;
  } catch {
    return null;
  }
}