
-- Webhooks table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  eventos TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia webhooks" ON public.webhooks
  FOR ALL TO authenticated
  USING (escritorio_id = get_user_escritorio_id() AND has_role(auth.uid(), 'dono'::app_role))
  WITH CHECK (escritorio_id = get_user_escritorio_id() AND has_role(auth.uid(), 'dono'::app_role));

CREATE POLICY "Escritorio ve webhooks" ON public.webhooks
  FOR SELECT TO authenticated
  USING (escritorio_id = get_user_escritorio_id());

CREATE POLICY "Service role full access webhooks" ON public.webhooks
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Webhook delivery logs
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status_code INTEGER,
  resposta TEXT,
  tentativas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio ve webhook_logs" ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (webhook_id IN (SELECT id FROM public.webhooks WHERE escritorio_id = get_user_escritorio_id()));

CREATE POLICY "Service role full access webhook_logs" ON public.webhook_logs
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_webhooks_escritorio ON public.webhooks(escritorio_id);
CREATE INDEX idx_webhook_logs_webhook ON public.webhook_logs(webhook_id, created_at DESC);
