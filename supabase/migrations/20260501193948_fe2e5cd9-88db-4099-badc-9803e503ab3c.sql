ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS arquivo_analise_caixa_url text,
  ADD COLUMN IF NOT EXISTS arquivo_analise_caixa_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS declaracao_enviada_em timestamptz;