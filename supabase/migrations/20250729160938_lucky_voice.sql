```sql
-- Adicionar colunas de anamnese à tabela runners
ALTER TABLE public.runners
ADD COLUMN injuries JSONB,
ADD COLUMN health_conditions JSONB,
ADD COLUMN past_training_experience TEXT,
ADD COLUMN physical_characteristics JSONB,
ADD COLUMN dietary_preferences TEXT;

-- Opcional: Adicionar comentários para documentação
COMMENT ON COLUMN public.runners.injuries IS 'Histórico de lesões do corredor em formato JSONB.';
COMMENT ON COLUMN public.runners.health_conditions IS 'Condições de saúde relevantes do corredor em formato JSONB.';
COMMENT ON COLUMN public.runners.past_training_experience IS 'Experiência de treino passada do corredor.';
COMMENT ON COLUMN public.runners.physical_characteristics IS 'Características físicas do corredor (ex: tipo de pisada, biotipo) em formato JSONB.';
COMMENT ON COLUMN public.runners.dietary_preferences IS 'Preferências ou restrições alimentares do corredor.';

-- Criar índices GIN para as colunas JSONB para otimizar buscas (se necessário)
CREATE INDEX IF NOT EXISTS runners_injuries_gin_idx ON public.runners USING GIN (injuries);
CREATE INDEX IF NOT EXISTS runners_health_conditions_gin_idx ON public.runners USING GIN (health_conditions);
CREATE INDEX IF NOT EXISTS runners_physical_characteristics_gin_idx ON public.runners USING GIN (physical_characteristics);

-- Atualizar a função de trigger para 'updated_at' se ela não incluir as novas colunas
-- (Assumindo que update_updated_at_column() já lida com qualquer coluna 'updated_at')
-- Se você tiver uma política RLS específica para 'runners', revise-a para incluir as novas colunas se necessário.
```