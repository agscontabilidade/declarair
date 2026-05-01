ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS arquivo_declaracao_url text,
  ADD COLUMN IF NOT EXISTS arquivo_declaracao_nome text,
  ADD COLUMN IF NOT EXISTS arquivo_declaracao_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS em_processamento boolean NOT NULL DEFAULT false;

-- Ensure declaracao_notas_internas has unique constraint on declaracao_id (used by ON CONFLICT in trigger)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'declaracao_notas_internas_declaracao_id_key'
  ) THEN
    ALTER TABLE public.declaracao_notas_internas
      ADD CONSTRAINT declaracao_notas_internas_declaracao_id_key UNIQUE (declaracao_id);
  END IF;
END $$;