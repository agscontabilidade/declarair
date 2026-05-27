
-- 1) REVOKE column SELECT on invite tokens (idempotente)
REVOKE SELECT (token_convite, token_convite_expira_em) ON public.clientes FROM authenticated;
REVOKE SELECT (token_convite, token_convite_expira_em) ON public.clientes FROM anon;

REVOKE SELECT (token) ON public.convites_cliente FROM authenticated;
REVOKE SELECT (token) ON public.convites_cliente FROM anon;

-- 2) Harden cliente INSERT on declaracoes to bind escritorio
DROP POLICY IF EXISTS "Cliente pode criar sua declaracao" ON public.declaracoes;
CREATE POLICY "Cliente pode criar sua declaracao"
  ON public.declaracoes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    cliente_id = public.get_user_cliente_id()
    AND escritorio_id = public.get_user_cliente_escritorio_id()
  );
