/*
  # Corrigir acesso público aos planos

  1. Políticas RLS
    - Permitir que usuários não autenticados vejam planos públicos
    - Manter restrições para planos administrativos

  2. Segurança
    - Apenas planos ativos e públicos são visíveis para não autenticados
    - Planos administrativos continuam restritos
*/

-- Remover política restritiva existente se houver
DROP POLICY IF EXISTS "Anyone can view active plans" ON plans;

-- Criar nova política que permite acesso público a planos específicos
CREATE POLICY "Public can view public plans"
  ON plans
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND name NOT IN ('Restrito', 'Admin', 'Gratuito')
  );

-- Manter política para admins verem todos os planos
CREATE POLICY "Admins can view all plans"
  ON plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );