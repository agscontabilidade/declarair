ALTER TABLE public.declaracao_analises DROP CONSTRAINT IF EXISTS declaracao_analises_declaracao_id_tipo_key;

-- Adiciona campos para facilitar a listagem no histórico sem precisar parsear o JSON grande
ALTER TABLE public.declaracao_analises ADD COLUMN IF NOT EXISTS veredito TEXT;
ALTER TABLE public.declaracao_analises ADD COLUMN IF NOT EXISTS resumo_visual JSONB;

-- Índice para performance na busca de histórico por declaração
CREATE INDEX IF NOT EXISTS idx_declaracao_analises_declaracao_id ON public.declaracao_analises(declaracao_id);