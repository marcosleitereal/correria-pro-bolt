/*
  # Atualizar função RPC para feedback com conteúdo do treino

  1. Função Atualizada
    - Inclui o campo `content` do treino na resposta
    - Mantém compatibilidade com código existente
    - Adiciona informações necessárias para exibir treino completo
*/

-- Remover função existente
DROP FUNCTION IF EXISTS get_training_for_feedback(uuid);

-- Criar função atualizada com conteúdo do treino
CREATE OR REPLACE FUNCTION get_training_for_feedback(feedback_token uuid)
RETURNS TABLE (
  training_id uuid,
  training_title text,
  training_content jsonb,
  training_created_at timestamptz,
  coach_id uuid,
  coach_name text,
  coach_avatar text,
  athlete_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as training_id,
    t.title as training_title,
    t.content as training_content,
    t.created_at as training_created_at,
    t.coach_id,
    COALESCE(p.full_name, 'Treinador') as coach_name,
    p.avatar_url as coach_avatar,
    CASE 
      WHEN t.runner_id IS NOT NULL THEN r.name
      WHEN t.group_id IS NOT NULL THEN g.name
      ELSE NULL
    END as athlete_name
  FROM trainings t
  LEFT JOIN profiles p ON t.coach_id = p.id
  LEFT JOIN runners r ON t.runner_id = r.id
  LEFT JOIN training_groups g ON t.group_id = g.id
  WHERE t.public_feedback_token = feedback_token
    AND t.status = 'enviado';
END;
$$;