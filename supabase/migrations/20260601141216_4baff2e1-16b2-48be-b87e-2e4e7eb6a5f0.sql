ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS cobranca_aviso_whatsapp_template text,
  ADD COLUMN IF NOT EXISTS cobranca_aviso_email_assunto text,
  ADD COLUMN IF NOT EXISTS cobranca_aviso_email_corpo text;