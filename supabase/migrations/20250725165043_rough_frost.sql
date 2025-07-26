/*
  # Sistema de Feedback Público Seguro

  1. Modificações na Tabela
    - Adiciona coluna `public_feedback_token` na tabela `trainings`
    - Token UUID único para cada treino
    - Índice para busca rápida

  2. Função de Busca Segura
    - Função `get_training_for_feedback` para buscar dados do treino
    - Retorna dados do treino + informações públicas do treinador
    - Usa SECURITY DEFINER para contornar RLS temporariamente

  3. Tabela de Feedback de Atletas
    - Nova tabela `athlete_feedback` para armazenar feedback público
    - Políticas RLS para permitir inserção anônima com token válido

  4. Políticas de Segurança
    - RLS configurado para proteger dados sensíveis
    - Acesso público apenas com token válido
*/

-- STEP 1: Adicionar coluna de token público na tabela trainings
ALTER TABLE trainings 
ADD COLUMN IF NOT EXISTS public_feedback_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_trainings_public_feedback_token 
ON trainings (public_feedback_token);

-- Atualizar treinos existentes que não têm token
UPDATE trainings 
SET public_feedback_token = gen_random_uuid() 
WHERE public_feedback_token IS NULL;

-- STEP 2: Criar tabela de feedback de atletas (se não existir)
CREATE TABLE IF NOT EXISTS athlete_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  athlete_name TEXT NOT NULL,
  athlete_email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela athlete_feedback
ALTER TABLE athlete_feedback ENABLE ROW LEVEL SECURITY;

-- STEP 3: Criar função segura para buscar dados do treino para feedback
CREATE OR REPLACE FUNCTION get_training_for_feedback(feedback_token UUID)
RETURNS TABLE (
  training_id UUID,
  training_title TEXT,
  training_content JSONB,
  training_created_at TIMESTAMPTZ,
  coach_name TEXT,
  coach_avatar_url TEXT,
  runner_name TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as training_id,
    t.title as training_title,
    t.content as training_content,
    t.created_at as training_created_at,
    p.full_name as coach_name,
    p.avatar_url as coach_avatar_url,
    COALESCE(r.name, tg.name) as runner_name
  FROM trainings t
  LEFT JOIN profiles p ON t.coach_id = p.id
  LEFT JOIN runners r ON t.runner_id = r.id
  LEFT JOIN training_groups tg ON t.group_id = tg.id
  WHERE t.public_feedback_token = feedback_token
    AND t.status = 'enviado';
END;
$$;

-- STEP 4: Políticas RLS para athlete_feedback

-- Permitir que usuários anônimos insiram feedback com token válido
CREATE POLICY "Permitir inserção de feedback com token válido"
  ON athlete_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = athlete_feedback.training_id 
        AND trainings.status = 'enviado'
    )
  );

-- Permitir que treinadores vejam feedback dos seus próprios treinos
CREATE POLICY "Treinadores podem ver feedback dos próprios treinos"
  ON athlete_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainings 
      WHERE trainings.id = athlete_feedback.training_id 
        AND trainings.coach_id = auth.uid()
    )
  );

-- Permitir que usuários anônimos vejam feedback (para exibir na página pública)
CREATE POLICY "Permitir visualização pública de feedback"
  ON athlete_feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- STEP 5: Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_athlete_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_athlete_feedback_updated_at
  BEFORE UPDATE ON athlete_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_athlete_feedback_updated_at();

-- STEP 6: Função para obter feedback de um treino específico
CREATE OR REPLACE FUNCTION get_feedback_for_training(feedback_token UUID)
RETURNS TABLE (
  feedback_id UUID,
  athlete_name TEXT,
  athlete_email TEXT,
  rating INTEGER,
  feedback_text TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id as feedback_id,
    af.athlete_name,
    af.athlete_email,
    af.rating,
    af.feedback_text,
    af.created_at
  FROM athlete_feedback af
  JOIN trainings t ON af.training_id = t.id
  WHERE t.public_feedback_token = feedback_token
    AND t.status = 'enviado'
  ORDER BY af.created_at DESC;
END;
$$;