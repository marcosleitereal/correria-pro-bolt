import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Validação crítica das variáveis de ambiente
if (!supabaseUrl) {
  console.error('❌ ERRO CRÍTICO: VITE_SUPABASE_URL não está definida no arquivo .env');
  console.error('📝 Solução: Adicione VITE_SUPABASE_URL=sua_url_do_supabase no arquivo .env');
  throw new Error('VITE_SUPABASE_URL não configurada. Verifique o arquivo .env na raiz do projeto.');
}

if (!supabaseAnonKey) {
  console.error('❌ ERRO CRÍTICO: VITE_SUPABASE_ANON_KEY não está definida no arquivo .env');
  console.error('📝 Solução: Adicione VITE_SUPABASE_ANON_KEY=sua_chave_anonima no arquivo .env');
  throw new Error('VITE_SUPABASE_ANON_KEY não configurada. Verifique o arquivo .env na raiz do projeto.');
}

// Validar formato da URL
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('❌ ERRO CRÍTICO: VITE_SUPABASE_URL tem formato inválido:', supabaseUrl);
  console.error('📝 Formato esperado: https://seu-projeto.supabase.co');
  throw new Error('VITE_SUPABASE_URL tem formato inválido. Deve ser uma URL válida.');
}

console.log('✅ Configurações do Supabase validadas:');
console.log('🔗 URL:', supabaseUrl);
console.log('🔑 Chave anônima:', supabaseAnonKey.substring(0, 20) + '...');

// Criar cliente Supabase
const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'correria-pro-web'
      }
    }
  }
);

// Teste de conectividade inicial
supabase.from('profiles').select('count').limit(1).then(
  ({ error }) => {
    if (error) {
      console.error('❌ ERRO DE CONECTIVIDADE com Supabase:', error.message);
      console.error('🔍 Verifique: 1) URL correta, 2) Chave válida, 3) Projeto ativo');
    } else {
      console.log('✅ Conectividade com Supabase confirmada');
    }
  }
).catch((error) => {
  console.error('❌ ERRO CRÍTICO na conectividade inicial:', error);
});

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
          level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
          weight: number | null;
          height: number | null;
          resting_heart_rate: number | null;
          max_heart_rate: number | null;
          notes: string | null;
          is_archived: boolean;
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