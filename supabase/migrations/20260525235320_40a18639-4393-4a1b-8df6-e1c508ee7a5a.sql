ALTER TABLE public.checklist_documentos
  ADD COLUMN IF NOT EXISTS lancado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lancado_em timestamptz NULL,
  ADD COLUMN IF NOT EXISTS lancado_por uuid NULL;

CREATE INDEX IF NOT EXISTS idx_checklist_lancado
  ON public.checklist_documentos(declaracao_id)
  WHERE lancado = true;