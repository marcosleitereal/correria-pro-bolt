/*
  # Criar função para calcular taxa de conclusão baseada em feedback

  1. Nova Função
    - `calculate_feedback_completion_rate(coach_id_param uuid)`
    - Calcula percentual de treinos finalizados que receberam feedback
    - Retorna valor decimal entre 0 e 100

  2. Lógica de Cálculo
    - Conta treinos finalizados do treinador (status = 'enviado')
    - Conta quantos desses treinos têm feedback na tabela athlete_feedback
    - Calcula percentual: (treinos_com_feedback / total_treinos_finalizados) * 100
    - Trata divisão por zero retornando 0

  3. Segurança
    - Função segura que só acessa dados do treinador especificado
    - Utiliza JOINs para garantir integridade dos dados
*/

CREATE OR REPLACE FUNCTION calculate_feedback_completion_rate(coach_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_finalized_trainings integer := 0;
    trainings_with_feedback integer := 0;
    completion_rate numeric := 0;
BEGIN
    -- Contar total de treinos finalizados do treinador
    SELECT COUNT(*)
    INTO total_finalized_trainings
    FROM trainings
    WHERE coach_id = coach_id_param
    AND status = 'enviado';

    -- Se não há treinos finalizados, retornar 0
    IF total_finalized_trainings = 0 THEN
        RETURN 0;
    END IF;

    -- Contar treinos finalizados que têm feedback
    SELECT COUNT(DISTINCT t.id)
    INTO trainings_with_feedback
    FROM trainings t
    INNER JOIN athlete_feedback af ON t.id = af.training_id
    WHERE t.coach_id = coach_id_param
    AND t.status = 'enviado';

    -- Calcular percentual
    completion_rate := (trainings_with_feedback::numeric / total_finalized_trainings::numeric) * 100;

    -- Arredondar para 2 casas decimais
    RETURN ROUND(completion_rate, 2);
END;
$$;