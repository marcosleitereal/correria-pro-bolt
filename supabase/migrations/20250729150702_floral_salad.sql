/*
  # Esconder planos administrativos do público

  1. Política de Segurança
    - Remove acesso público a planos administrativos
    - Apenas planos públicos são visíveis para usuários não autenticados
    - Planos como "Elite Admin", "Restrito", "Admin" ficam ocultos

  2. Critérios de Filtragem
    - is_active = true (plano ativo)
    - Nome não pode conter "Admin", "Restrito", "Gratuito"
    - Apenas planos destinados ao público geral
*/

-- Remover política anterior que estava muito permissiva
DROP POLICY IF EXISTS "Public can view public plans" ON plans;

-- Criar nova política mais restritiva
CREATE POLICY "Public can view only customer plans" ON plans
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND name NOT ILIKE '%admin%'
    AND name NOT ILIKE '%restrito%' 
    AND name NOT ILIKE '%gratuito%'
    AND name NOT IN ('Elite Admin', 'Restrito', 'Admin', 'Gratuito')
  );