
CREATE TABLE public.lembretes_enviados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  declaracao_id UUID,
  canal TEXT NOT NULL CHECK (canal IN ('email','whatsapp')),
  prazo_final DATE NOT NULL,
  mensagem TEXT,
  enviado_por UUID,
  status TEXT NOT NULL DEFAULT 'enfileirado' CHECK (status IN ('enfileirado','falhou')),
  erro TEXT,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lembretes_escritorio_cliente ON public.lembretes_enviados (escritorio_id, cliente_id, enviado_em DESC);
CREATE INDEX idx_lembretes_declaracao ON public.lembretes_enviados (declaracao_id);

GRANT SELECT, INSERT ON public.lembretes_enviados TO authenticated;
GRANT ALL ON public.lembretes_enviados TO service_role;

ALTER TABLE public.lembretes_enviados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio ve seus lembretes"
ON public.lembretes_enviados FOR SELECT TO authenticated
USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Escritorio insere lembretes"
ON public.lembretes_enviados FOR INSERT TO authenticated
WITH CHECK (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Service role full access lembretes"
ON public.lembretes_enviados FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
