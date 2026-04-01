ALTER TABLE public.mensagens_chat 
ADD COLUMN IF NOT EXISTS whatsapp_enviado_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_erro TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_tentativas INTEGER DEFAULT 0;