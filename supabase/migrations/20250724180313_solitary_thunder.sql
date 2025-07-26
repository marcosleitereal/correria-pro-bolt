/*
  # Atualizar Dados dos Planos

  1. Atualizações
    - Corrigir dados dos planos existentes
    - Garantir que todos os campos necessários estejam preenchidos

  2. Dados
    - Atualizar planos com informações completas
*/

-- Atualizar dados dos planos existentes
UPDATE plans SET
  max_athletes = CASE 
    WHEN name = 'Starter' THEN 5
    WHEN name = 'Professional' THEN 25
    WHEN name = 'Elite' THEN -1
    ELSE max_athletes
  END,
  is_popular = CASE 
    WHEN name = 'Professional' THEN true
    ELSE false
  END,
  features = CASE 
    WHEN name = 'Starter' THEN '["Dashboard de performance", "Geração de treinos com IA", "Até 5 atletas", "Exportação em PDF", "Suporte por email"]'::jsonb
    WHEN name = 'Professional' THEN '["Tudo do plano Starter", "Analytics avançados", "Templates personalizados", "Grupos de treino", "Suporte prioritário", "Integrações com dispositivos"]'::jsonb
    WHEN name = 'Elite' THEN '["Tudo do plano Professional", "IA personalizada", "Consultoria especializada", "API para integrações", "Suporte 24/7 dedicado", "Recursos beta antecipados"]'::jsonb
    ELSE features
  END
WHERE name IN ('Starter', 'Professional', 'Elite');