/*
  # Sistema de Notificações em Tempo Real

  1. Nova Tabela
    - `notifications`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `recipient_id` (uuid, foreign key para profiles.id)
      - `type` (text, tipo da notificação)
      - `message` (text, mensagem da notificação)
      - `related_entity_id` (uuid, ID da entidade relacionada)
      - `is_read` (boolean, status de leitura)

  2. Segurança
    - Enable RLS na tabela `notifications`
    - Política para usuários verem apenas suas próprias notificações
    - Política para inserção de notificações pelo sistema

  3. Triggers
    - Trigger para criar notificação quando feedback é enviado
    - Função para atualizar updated_at automaticamente

  4. Índices
    - Índice para busca rápida por recipient_id
    - Índice para busca por status de leitura
*/

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  recipient_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  related_entity_id uuid,
  is_read boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Adicionar foreign key para profiles
ALTER TABLE notifications 
ADD CONSTRAINT notifications_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS notifications_recipient_id_idx ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias notificações
CREATE POLICY "Usuários podem ver suas próprias notificações"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Política para marcar notificações como lidas
CREATE POLICY "Usuários podem atualizar suas próprias notificações"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Política para inserção de notificações (sistema)
CREATE POLICY "Sistema pode inserir notificações"
  ON notifications
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Função para criar notificação quando feedback é enviado
CREATE OR REPLACE FUNCTION create_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  coach_id_var uuid;
  training_title_var text;
  athlete_name_var text;
  notification_message text;
BEGIN
  -- Buscar dados do treino e treinador
  SELECT 
    t.coach_id,
    t.title,
    COALESCE(r.name, 'Atleta') as athlete_name
  INTO 
    coach_id_var,
    training_title_var,
    athlete_name_var
  FROM trainings t
  LEFT JOIN runners r ON t.runner_id = r.id
  WHERE t.id = NEW.training_id;

  -- Se não encontrou o treino, não criar notificação
  IF coach_id_var IS NULL THEN
    RETURN NEW;
  END IF;

  -- Montar mensagem da notificação
  notification_message := athlete_name_var || ' deixou um novo feedback sobre o treino "' || training_title_var || '"';

  -- Inserir notificação para o treinador
  INSERT INTO notifications (
    recipient_id,
    type,
    message,
    related_entity_id
  ) VALUES (
    coach_id_var,
    'NEW_FEEDBACK',
    notification_message,
    NEW.training_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar notificação após inserção de feedback
CREATE TRIGGER create_feedback_notification_trigger
  AFTER INSERT ON athlete_feedback
  FOR EACH ROW
  EXECUTE FUNCTION create_feedback_notification();

-- Função para buscar notificações não lidas de um usuário
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE recipient_id = user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id uuid)
RETURNS boolean AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE notifications
  SET is_read = true, updated_at = now()
  WHERE id = notification_id AND recipient_id = auth.uid();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE notifications
  SET is_read = true, updated_at = now()
  WHERE recipient_id = auth.uid() AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;