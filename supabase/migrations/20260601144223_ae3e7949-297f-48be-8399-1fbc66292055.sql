ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS comprovacao_processamento_url TEXT,
  ADD COLUMN IF NOT EXISTS comprovacao_processamento_nome TEXT,
  ADD COLUMN IF NOT EXISTS comprovacao_processamento_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comprovacao_processamento_enviada_em TIMESTAMPTZ;