
-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissoes JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  ultimo_uso TIMESTAMPTZ,
  expira_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_escritorio ON public.api_keys(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_ativo ON public.api_keys(ativo) WHERE ativo = true;

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono pode gerenciar API keys"
ON public.api_keys
FOR ALL
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::app_role)
)
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::app_role)
);

CREATE POLICY "Service role full access api_keys"
ON public.api_keys
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);
