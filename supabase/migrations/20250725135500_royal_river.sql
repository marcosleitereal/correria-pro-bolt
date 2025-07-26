/*
  # Criar tabela app_settings ausente

  1. Nova Tabela
    - `app_settings`
      - `id` (uuid, primary key)
      - `trial_duration_days` (integer, padrão 30)
      - `trial_athlete_limit` (integer, padrão 5)
      - `trial_training_limit` (integer, padrão 10)
      - `updated_by` (uuid, referência para users)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `app_settings`
    - Adicionar políticas para admins gerenciarem e usuários visualizarem

  3. Dados Iniciais
    - Inserir configuração padrão inicial
*/

-- Criar tabela app_settings se não existir
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_duration_days integer NOT NULL DEFAULT 30,
  trial_athlete_limit integer NOT NULL DEFAULT 5,
  trial_training_limit integer NOT NULL DEFAULT 10,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar configurações da aplicação"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

CREATE POLICY "Usuários podem visualizar configurações da aplicação"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir configuração padrão se não existir
INSERT INTO public.app_settings (trial_duration_days, trial_athlete_limit, trial_training_limit)
SELECT 30, 5, 10
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);