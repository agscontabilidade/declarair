
-- Conta Azul integration config table
CREATE TABLE IF NOT EXISTS public.integracoes_contaazul (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_secret_encrypted TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expira_em TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT FALSE,
  ultima_sincronizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(escritorio_id)
);

ALTER TABLE public.integracoes_contaazul ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono gerencia integracao contaazul"
ON public.integracoes_contaazul
FOR ALL
TO authenticated
USING (
  escritorio_id = get_user_escritorio_id() AND has_role(auth.uid(), 'dono'::app_role)
)
WITH CHECK (
  escritorio_id = get_user_escritorio_id() AND has_role(auth.uid(), 'dono'::app_role)
);

CREATE POLICY "Service role full access integracoes_contaazul"
ON public.integracoes_contaazul
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX idx_integracoes_ca_escritorio ON public.integracoes_contaazul(escritorio_id);

-- Add conta_azul_id to clientes for sync mapping
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS conta_azul_id TEXT;
CREATE INDEX IF NOT EXISTS idx_clientes_conta_azul ON public.clientes(conta_azul_id) WHERE conta_azul_id IS NOT NULL;
