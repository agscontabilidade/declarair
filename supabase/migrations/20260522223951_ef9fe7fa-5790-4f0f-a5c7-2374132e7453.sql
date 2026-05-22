ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS ultima_mensagem_email text,
  ADD COLUMN IF NOT EXISTS ultima_mensagem_email_em timestamptz;