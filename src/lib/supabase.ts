import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Criar cliente Supabase
const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

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