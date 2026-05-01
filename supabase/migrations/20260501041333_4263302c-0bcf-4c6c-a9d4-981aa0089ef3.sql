ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS status_processamento_rfb text NOT NULL DEFAULT 'aguardando';

ALTER TABLE public.declaracoes
  DROP CONSTRAINT IF EXISTS declaracoes_status_processamento_rfb_check;

ALTER TABLE public.declaracoes
  ADD CONSTRAINT declaracoes_status_processamento_rfb_check
  CHECK (status_processamento_rfb IN ('aguardando','processada','pendencias','malha_fina'));

-- Migra valores existentes do booleano antigo
UPDATE public.declaracoes
SET status_processamento_rfb = 'processada'
WHERE em_processamento = true AND status_processamento_rfb = 'aguardando';