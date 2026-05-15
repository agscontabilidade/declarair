ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS arquivo_mei_url text,
  ADD COLUMN IF NOT EXISTS arquivo_mei_nome text,
  ADD COLUMN IF NOT EXISTS arquivo_mei_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS mei_validado_em timestamptz,
  ADD COLUMN IF NOT EXISTS mei_extracao jsonb,
  ADD COLUMN IF NOT EXISTS arquivo_darf_url text,
  ADD COLUMN IF NOT EXISTS arquivo_darf_nome text,
  ADD COLUMN IF NOT EXISTS arquivo_darf_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS darf_validado_em timestamptz,
  ADD COLUMN IF NOT EXISTS darf_extracao jsonb;