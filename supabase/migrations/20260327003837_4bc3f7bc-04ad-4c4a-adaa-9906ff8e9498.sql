ALTER TABLE public.mensagens_chat 
ADD COLUMN IF NOT EXISTS enviado_whatsapp BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_mensagens_chat_whatsapp 
ON public.mensagens_chat(enviado_whatsapp, created_at);