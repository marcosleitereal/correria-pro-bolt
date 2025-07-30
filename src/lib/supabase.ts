import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// CRÍTICO: Verificação de segurança para evitar erros em produção
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('❌ SUPABASE: Variáveis de ambiente não configuradas corretamente');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'Não configurada');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Configurada' : 'Não configurada');
  
  // Mostrar erro crítico se estiver usando placeholder
  if (supabaseUrl?.includes('placeholder')) {
    console.error('🚨 ERRO CRÍTICO: Usando URL placeholder do Supabase!');
    console.error('Configure as variáveis de ambiente no Netlify:');
    console.error('- VITE_SUPABASE_URL: URL real do seu projeto Supabase');
    console.error('- VITE_SUPABASE_ANON_KEY: Chave pública do Supabase');
  }
  
  // Em produção, mostrar erro mais amigável
  if (typeof window !== 'undefined') {
    console.warn('⚠️ SUPABASE: Configuração ausente. Login não funcionará.');
  }
}

// CRÍTICO: Não criar cliente se variáveis não estão configuradas
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  // Criar cliente Supabase apenas se configurado corretamente
  supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'correria-pro@1.0.0'
        }
      }
    }
  );
} else {
  // Criar cliente mock para evitar erros
  console.error('🚨 SUPABASE: Criando cliente mock - funcionalidades limitadas');
  supabase = {
    auth: {
      signInWithPassword: () => Promise.reject(new Error('Supabase não configurado. Configure as variáveis de ambiente.')),
      signUp: () => Promise.reject(new Error('Supabase não configurado. Configure as variáveis de ambiente.')),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.reject(new Error('Supabase não configurado')),
      insert: () => Promise.reject(new Error('Supabase não configurado')),
      update: () => Promise.reject(new Error('Supabase não configurado')),
      delete: () => Promise.reject(new Error('Supabase não configurado'))
    })
  };
}

// Função para verificar se Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
};

// Função para obter informações de configuração
export const getSupabaseConfig = () => {
  return {
    url: supabaseUrl || 'Não configurada',
    hasKey: !!supabaseAnonKey,
    isConfigured: isSupabaseConfigured(),
    isPlaceholder: supabaseUrl?.includes('placeholder') || false
  };
};

// Mostrar aviso se não estiver configurado
if (typeof window !== 'undefined' && !isSupabaseConfigured()) {
  // Mostrar aviso visual na página
  setTimeout(() => {
    const warningDiv = document.createElement('div');
    warningDiv.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        background: #dc2626; 
        color: white; 
        padding: 1rem; 
        text-align: center; 
        z-index: 9999;
        font-family: system-ui;
      ">
        <strong>⚠️ CONFIGURAÇÃO NECESSÁRIA:</strong> 
        Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-left: 1rem; 
          background: rgba(255,255,255,0.2); 
          border: none; 
          color: white; 
          padding: 0.25rem 0.5rem; 
          border-radius: 0.25rem; 
          cursor: pointer;
        ">✕</button>
      </div>
    `;
    document.body.appendChild(warningDiv);
  }, 1000);
}

// Função para testar conectividade
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return { 
      connected: false, 
      error: 'Supabase não configurado. Configure as variáveis de ambiente.',
      config: getSupabaseConfig()
    };
  }

  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    return { 
      connected: !error, 
      error: error?.message || null,
      config: getSupabaseConfig()
    };
  } catch (error: any) {
    return { 
      connected: false, 
      error: error.message,
      config: getSupabaseConfig()
    }
  }
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: 'coach' | 'admin';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: 'coach' | 'admin';
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          role?: 'coach' | 'admin';
          avatar_url?: string | null;
        };
      };
      runners: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          email: string | null;
          birth_date: string | null;
          gender: string | null;
          weight_kg: number | null;
          height_cm: number | null;
          main_goal: string | null;
          fitness_level: string;
          resting_heart_rate: number | null;
          max_heart_rate: number | null;
          notes: string | null;
          injuries: any | null;
          health_conditions: any | null;
          past_training_experience: string | null;
          physical_characteristics: any | null;
          dietary_preferences: string | null;
          is_archived: boolean;
          last_training_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          coach_id: string;
          name: string;
          email?: string | null;
          birth_date?: string | null;
          level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
          weight?: number | null;
          height?: number | null;
          resting_heart_rate?: number | null;
          max_heart_rate?: number | null;
          notes?: string | null;
          injuries?: any | null;
          health_conditions?: any | null;
          past_training_experience?: string | null;
          physical_characteristics?: any | null;
          dietary_preferences?: string | null;
          is_archived?: boolean;
        };
        Update: {
          name?: string;
          email?: string | null;
          birth_date?: string | null;
          level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
          weight?: number | null;
          height?: number | null;
          resting_heart_rate?: number | null;
          max_heart_rate?: number | null;
          notes?: string | null;
          injuries?: any | null;
          health_conditions?: any | null;
          past_training_experience?: string | null;
          physical_characteristics?: any | null;
          dietary_preferences?: string | null;
          is_archived?: boolean;
        };
      };
      training_groups: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          description: string | null;
          level: 'iniciante' | 'intermediario' | 'avancado' | null;
          status: 'ativo' | 'inativo';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          coach_id: string;
          name: string;
          description?: string | null;
          level?: 'iniciante' | 'intermediario' | 'avancado' | null;
          status?: 'ativo' | 'inativo';
        };
        Update: {
          name?: string;
          description?: string | null;
          level?: 'iniciante' | 'intermediario' | 'avancado' | null;
          status?: 'ativo' | 'inativo';
        };
      };
      trainings: {
        Row: {
          id: string;
          coach_id: string;
          runner_id: string | null;
          group_id: string | null;
          title: string;
          content: any | null;
          status: 'rascunho' | 'enviado' | 'concluido';
          scheduled_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          coach_id: string;
          runner_id?: string | null;
          group_id?: string | null;
          title: string;
          content?: any | null;
          status?: 'rascunho' | 'enviado' | 'concluido';
          scheduled_date?: string | null;
        };
        Update: {
          title?: string;
          content?: any | null;
          status?: 'rascunho' | 'enviado' | 'concluido';
          scheduled_date?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: 'trialing' | 'active' | 'canceled';
          plan_name: string;
          trial_ends_at: string | null;
          current_period_start: string;
          current_period_end: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          status?: 'trialing' | 'active' | 'canceled';
          plan_name?: string;
          trial_ends_at?: string | null;
          current_period_start?: string;
          current_period_end?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          status?: 'trialing' | 'active' | 'canceled';
          plan_name?: string;
          trial_ends_at?: string | null;
          current_period_start?: string;
          current_period_end?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          last_used_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          key_hash: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
    };
    Views: {
      user_subscription_status: {
        Row: {
          user_id: string;
          email: string | null;
          full_name: string | null;
          role: 'coach' | 'admin' | null;
          subscription_status: 'trialing' | 'active' | 'canceled' | null;
          plan_name: string | null;
          trial_ends_at: string | null;
          current_period_end: string | null;
          has_access: boolean | null;
        };
      };
    };
  };
}

export { supabase };