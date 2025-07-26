/*
  # Adicionar coluna details à tabela notifications

  1. Modificações na Tabela
    - Adiciona coluna `details` (jsonb) à tabela `notifications`
    - Permite armazenar dados estruturados adicionais nas notificações

  2. Funcionalidade
    - A coluna `details` permitirá armazenar informações como `runnerId` e `trainingId`
    - Essencial para navegação inteligente nas notificações de feedback
    - Compatível com a função `create_feedback_notification` atualizada
*/

-- Adicionar coluna details à tabela notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS details jsonb DEFAULT NULL;

-- Criar índice para melhor performance em consultas no campo details
CREATE INDEX IF NOT EXISTS notifications_details_idx 
ON public.notifications USING gin (details);