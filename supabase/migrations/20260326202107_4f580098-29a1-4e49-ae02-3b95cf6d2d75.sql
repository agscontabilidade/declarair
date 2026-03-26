
-- Tabela de convites de colaboradores
CREATE TABLE IF NOT EXISTS public.colaborador_convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  papel TEXT NOT NULL DEFAULT 'colaborador',
  token TEXT NOT NULL UNIQUE,
  enviado_por UUID NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  expira_em TIMESTAMPTZ NOT NULL,
  usado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_colaborador_convites_token ON public.colaborador_convites(token);
CREATE INDEX idx_colaborador_convites_escritorio ON public.colaborador_convites(escritorio_id);
CREATE INDEX idx_colaborador_convites_email ON public.colaborador_convites(email);

ALTER TABLE public.colaborador_convites ENABLE ROW LEVEL SECURITY;

-- Dono pode gerenciar convites do seu escritório
CREATE POLICY "Dono pode gerenciar convites"
ON public.colaborador_convites
FOR ALL
TO authenticated
USING (
  escritorio_id = get_user_escritorio_id()
  AND has_role(auth.uid(), 'dono'::app_role)
)
WITH CHECK (
  escritorio_id = get_user_escritorio_id()
  AND has_role(auth.uid(), 'dono'::app_role)
);

-- Authenticated users can view their office invites (for listing)
CREATE POLICY "Usuarios podem ver convites do escritorio"
ON public.colaborador_convites
FOR SELECT
TO authenticated
USING (
  escritorio_id = get_user_escritorio_id()
);

-- Qualquer pessoa autenticada pode ver convite válido pelo token (para aceitar)
CREATE POLICY "Link de convite publico"
ON public.colaborador_convites
FOR SELECT
TO authenticated
USING (
  usado = false
  AND expira_em > NOW()
);

-- Service role full access
CREATE POLICY "Service role full access colaborador_convites"
ON public.colaborador_convites
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);
