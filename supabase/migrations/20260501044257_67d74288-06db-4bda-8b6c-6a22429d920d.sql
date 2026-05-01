
ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS arquivo_recibo_url text,
  ADD COLUMN IF NOT EXISTS arquivo_recibo_nome text,
  ADD COLUMN IF NOT EXISTS arquivo_recibo_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS recibo_validado_em timestamptz,
  ADD COLUMN IF NOT EXISTS declaracao_validada_em timestamptz,
  ADD COLUMN IF NOT EXISTS declaracao_extracao jsonb,
  ADD COLUMN IF NOT EXISTS recibo_extracao jsonb;
