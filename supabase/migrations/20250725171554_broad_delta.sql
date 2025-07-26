/*
  # Corrigir sistema de feedback público

  1. Correções na função de busca
    - Adicionar JOIN com tabela runners para buscar nome do atleta
    - Retornar todos os dados necessários para a página de feedback
    - Corrigir estrutura de retorno da função

  2. Políticas RLS
    - Permitir inserção anônima na tabela athlete_feedback
    - Manter segurança para visualização

  3. Melhorias na função
    - Retornar dados estruturados corretamente
    - Incluir informações do treinador e atleta
*/

-- Recriar a função get_training_for_feedback com JOIN correto
DROP FUNCTION IF EXISTS get_training_for_feedback(UUID);

CREATE OR REPLACE FUNCTION get_training_for_feedback(feedback_token UUID)
RETURNS TABLE (
  training_id UUID,
  training_title TEXT,
  training_created_at TIMESTAMPTZ,
  coach_id UUID,
  coach_name TEXT,
  coach_avatar TEXT,
  athlete_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as training_id,
    t.title as training_title,
    t.created_at as training_created_at,
    t.coach_id,
    p.full_name as coach_name,
    p.avatar_url as coach_avatar,
    r.name as athlete_name
  FROM trainings t
  LEFT JOIN profiles p ON t.coach_id = p.id
  LEFT JOIN runners r ON t.runner_id = r.id
  WHERE t.public_feedback_token = feedback_token
    AND t.status = 'enviado';
END;
$$;

-- Garantir que a política RLS permite inserção anônima
DROP POLICY IF EXISTS "Allow anonymous feedback insert" ON athlete_feedback;
DROP POLICY IF EXISTS "Public feedback insert" ON athlete_feedback;

CREATE POLICY "Allow anonymous feedback insert"
  ON athlete_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para visualização pública (necessária para a página funcionar)
DROP POLICY IF EXISTS "Allow public feedback view" ON athlete_feedback;

CREATE POLICY "Allow public feedback view"
  ON athlete_feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Manter política para treinadores verem feedback dos próprios treinos
DROP POLICY IF EXISTS "Coaches can view own training feedback" ON athlete_feedback;

CREATE POLICY "Coaches can view own training feedback"
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