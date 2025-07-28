export interface Runner {
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
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: 'coach' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingGroup {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  level: 'iniciante' | 'intermediario' | 'avancado' | null;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface TrainingStyle {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  intensity: 'muito_baixa' | 'baixa' | 'moderada' | 'moderada_alta' | 'alta' | 'muito_alta';
  category: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Training {
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
}

export interface Subscription {
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
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AthleteFeedback {
  id: string;
  training_id: string;
  coach_id: string;
  feedback_text: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface ObservationTemplate {
  id: string;
  coach_id: string;
  name: string;
  content: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIProvider {
  id: string;
  name: string;
  api_key_encrypted: string | null;
  selected_model: string | null;
  is_active: boolean;
  is_global_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface AISetting {
  id: string;
  setting_name: string;
  setting_value: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  max_athletes: number;
  max_trainings_per_month: number | null;
  features: string[] | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  mercadopago_plan_id: string | null;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentGateway {
  id: string;
  gateway_name: string;
  public_key: string | null;
  secret_key_encrypted: string | null;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface Notification {
  id: string;
  created_at: string;
  recipient_id: string;
  type: string;
  message: string;
  related_entity_id: string | null;
  is_read: boolean;
  updated_at: string;
  details: any | null;
}

export interface AppSettings {
  id: string;
  trial_duration_days: number;
  trial_athlete_limit: number;
  trial_training_limit: number;
  updated_by: string | null;
  updated_at: string;
}