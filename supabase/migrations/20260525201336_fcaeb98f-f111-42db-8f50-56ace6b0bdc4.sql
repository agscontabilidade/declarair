ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS observacoes_cliente TEXT,
  ADD COLUMN IF NOT EXISTS observacoes_cliente_atualizado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS observacoes_cliente_lida_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_declaracoes_obs_cliente_nao_lida
  ON public.declaracoes (escritorio_id)
  WHERE observacoes_cliente IS NOT NULL AND observacoes_cliente_lida_em IS NULL;