/*
  # Corrigir lógica de criação de notificações

  1. Correções
    - Atualizar função de trigger para usar runner_id correto
    - Melhorar mensagem de notificação
    - Garantir que related_entity_id seja o runner_id

  2. Segurança
    - Manter políticas RLS existentes
    - Função executada com privilégios de sistema
*/

-- Recriar a função de trigger para notificações de feedback
CREATE OR REPLACE FUNCTION create_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  coach_id_var UUID;
  runner_name_var TEXT;
  training_title_var TEXT;
  runner_id_var UUID;
BEGIN
  -- Buscar dados do treino e corredor
  SELECT 
    t.coach_id,
    t.title,
    t.runner_id,
    r.name
  INTO 
    coach_id_var,
    training_title_var,
    runner_id_var,
    runner_name_var
  FROM trainings t
  LEFT JOIN runners r ON t.runner_id = r.id
  WHERE t.id = NEW.training_id;

  -- Se encontrou os dados, criar notificação
  IF coach_id_var IS NOT NULL THEN
    INSERT INTO notifications (
      recipient_id,
      type,
      message,
      related_entity_id
    ) VALUES (
      coach_id_var,
      'NEW_FEEDBACK',
      COALESCE(runner_name_var, 'Um atleta') || ' deixou um novo feedback sobre o treino "' || COALESCE(training_title_var, 'Treino') || '"',
      runner_id_var  -- CRÍTICO: Usar runner_id como related_entity_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;