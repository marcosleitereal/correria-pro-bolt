/*
  # Permitir inserção de feedback por usuários anônimos

  1. Políticas de Segurança
    - Remove políticas restritivas existentes na tabela athlete_feedback
    - Cria nova política que permite inserção anônima de feedback
    - Mantém políticas de visualização para treinadores

  2. Segurança
    - Usuários anônimos podem inserir feedback
    - Treinadores podem visualizar feedback dos próprios treinos
    - Visualização pública de feedback permitida
*/

-- Remove políticas existentes que podem estar bloqueando inserções anônimas
DROP POLICY IF EXISTS "Permitir inserção de feedback com token válido" ON public.athlete_feedback;
DROP POLICY IF EXISTS "Public feedback insert" ON public.athlete_feedback;

-- Cria política que permite inserção anônima de feedback
CREATE POLICY "Allow anonymous feedback insert"
  ON public.athlete_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Mantém política para treinadores visualizarem feedback dos próprios treinos
DROP POLICY IF EXISTS "Treinadores podem ver feedback dos próprios treinos" ON public.athlete_feedback;
CREATE POLICY "Coaches can view own training feedback"
  ON public.athlete_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM trainings 
      WHERE trainings.id = athlete_feedback.training_id 
      AND trainings.coach_id = auth.uid()
    )
  );

-- Permite visualização pública de feedback (para exibição na página)
DROP POLICY IF EXISTS "Permitir visualização pública de feedback" ON public.athlete_feedback;
CREATE POLICY "Allow public feedback view"
  ON public.athlete_feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);