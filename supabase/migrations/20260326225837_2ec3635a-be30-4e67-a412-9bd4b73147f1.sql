
CREATE TABLE IF NOT EXISTS public.convites_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES escritorios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  nome_sugerido TEXT,
  cpf_sugerido TEXT,
  email_sugerido TEXT,
  mensagem_personalizada TEXT,
  usado BOOLEAN DEFAULT FALSE,
  usado_em TIMESTAMPTZ,
  usado_por_cliente_id UUID REFERENCES clientes(id),
  expira_em TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_convites_cliente_token ON convites_cliente(token);
CREATE INDEX idx_convites_cliente_escritorio ON convites_cliente(escritorio_id);
CREATE INDEX idx_convites_cliente_usado ON convites_cliente(usado) WHERE usado = false;

ALTER TABLE convites_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio pode gerenciar seus convites"
ON convites_cliente
FOR ALL
TO authenticated
USING (escritorio_id = public.get_user_escritorio_id())
WITH CHECK (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Service role full access convites_cliente"
ON convites_cliente
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);
