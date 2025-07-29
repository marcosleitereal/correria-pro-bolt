/*
  # Atualizar visibilidade dos planos administrativos

  1. Alterações
    - Adicionar coluna `is_public` para controlar visibilidade pública
    - Marcar planos administrativos como não públicos
    - Manter planos pagos como públicos

  2. Segurança
    - Apenas planos públicos aparecem na página de preços
    - Planos administrativos ficam disponíveis apenas para admins
*/

-- Adicionar coluna is_public se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plans' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE plans ADD COLUMN is_public boolean DEFAULT true;
  END IF;
END $$;

-- Marcar planos administrativos como não públicos
UPDATE plans 
SET is_public = false 
WHERE name IN ('Restrito', 'Elite Admin') OR price_monthly = 0;

-- Garantir que planos pagos sejam públicos
UPDATE plans 
SET is_public = true 
WHERE price_monthly > 0 AND name NOT IN ('Restrito', 'Elite Admin');

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_plans_public_active 
ON plans (is_public, is_active) 
WHERE is_public = true AND is_active = true;