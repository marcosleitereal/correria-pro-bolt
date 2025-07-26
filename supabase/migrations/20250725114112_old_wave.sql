/*
  # Criar tabela de gateways de pagamento

  1. Nova Tabela
    - `payment_gateways`
      - `id` (uuid, chave primária)
      - `gateway_name` (text, único - nome do gateway como 'stripe', 'mercadopago')
      - `public_key` (text, opcional - chave pública do gateway)
      - `secret_key_encrypted` (text, opcional - chave secreta criptografada)
      - `webhook_secret` (text, opcional - segredo do webhook)
      - `is_active` (boolean, padrão false - indica se o gateway está ativo)
      - `updated_by` (uuid, referência ao usuário que fez a última atualização)
      - `updated_at` (timestamp, data da última atualização)
      - `created_at` (timestamp, data de criação)

  2. Segurança
    - Habilitar RLS na tabela `payment_gateways`
    - Política para administradores gerenciarem gateways
    - Política para usuários autenticados visualizarem gateways ativos

  3. Dados Iniciais
    - Inserir registros para 'stripe' e 'mercadopago' como inativos
*/

-- Criar tabela de gateways de pagamento
CREATE TABLE IF NOT EXISTS payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name text UNIQUE NOT NULL,
  public_key text,
  secret_key_encrypted text,
  webhook_secret text,
  is_active boolean DEFAULT false NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

-- Política para administradores gerenciarem todos os gateways
CREATE POLICY "Admins can manage payment gateways"
  ON payment_gateways
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'dev@sonnik.com.br'
    )
  );

-- Política para usuários autenticados visualizarem gateways ativos
CREATE POLICY "Users can view active payment gateways"
  ON payment_gateways
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Inserir dados iniciais para Stripe e Mercado Pago
INSERT INTO payment_gateways (gateway_name, is_active)
VALUES
  ('stripe', false),
  ('mercadopago', false)
ON CONFLICT (gateway_name) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS payment_gateways_gateway_name_idx ON payment_gateways (gateway_name);
CREATE INDEX IF NOT EXISTS payment_gateways_is_active_idx ON payment_gateways (is_active);