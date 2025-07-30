/*
  # Correção CRÍTICA - Planos e Ativação

  1. Criar planos ativos se não existirem
  2. Garantir que existe plano "Restrito"
  3. Ativar planos necessários
  4. Corrigir webhook para encontrar planos
*/

-- 1. CRIAR PLANOS SE NÃO EXISTIREM
INSERT INTO plans (name, description, price_monthly, max_athletes, is_active, is_popular, stripe_price_id_monthly)
VALUES 
  ('Básico', 'Plano básico para treinadores iniciantes', 29.90, 10, true, false, 'price_1RbPUPBnjFk91bSiqDgyZW9j'),
  ('Profissional', 'Plano completo para treinadores profissionais', 79.90, 50, true, true, 'price_1RbPUPBnjFk91bSiqDgyZW9j'),
  ('Elite', 'Plano premium com recursos avançados', 149.90, -1, true, false, 'price_1RbPUPBnjFk91bSiqDgyZW9j'),
  ('Restrito', 'Plano para usuários com trial expirado', 0.00, 0, true, false, null)
ON CONFLICT (name) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  price_monthly = EXCLUDED.price_monthly,
  max_athletes = EXCLUDED.max_athletes,
  stripe_price_id_monthly = EXCLUDED.stripe_price_id_monthly;

-- 2. GARANTIR QUE PELO MENOS UM PLANO ESTÁ ATIVO
UPDATE plans 
SET is_active = true 
WHERE name IN ('Básico', 'Profissional', 'Elite');

-- 3. VERIFICAR SE PLANOS FORAM CRIADOS
DO $$
DECLARE
    plan_count INTEGER;
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM plans;
    SELECT COUNT(*) INTO active_count FROM plans WHERE is_active = true;
    
    RAISE NOTICE 'PLANOS CRIADOS: Total = %, Ativos = %', plan_count, active_count;
    
    IF active_count = 0 THEN
        RAISE EXCEPTION 'ERRO CRÍTICO: Nenhum plano ativo encontrado após criação!';
    END IF;
END $$;