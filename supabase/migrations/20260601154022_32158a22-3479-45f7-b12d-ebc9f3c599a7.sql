
-- 1) Revogar SELECT da coluna `token` em colaborador_convites para clientes autenticados.
-- O token será exposto apenas via função SECURITY DEFINER controlada (dono do mesmo escritório).
REVOKE SELECT (token) ON public.colaborador_convites FROM authenticated;
-- Re-garantir SELECT das demais colunas para authenticated (PostgREST list/read).
GRANT SELECT (id, escritorio_id, email, nome, papel, enviado_por, usado, expira_em, usado_em, created_at, permissoes)
  ON public.colaborador_convites TO authenticated;

-- 2) RPC para o dono recuperar o token de um convite pendente do próprio escritório.
CREATE OR REPLACE FUNCTION public.get_colaborador_convite_token(_convite_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_token text;
  v_escritorio uuid;
BEGIN
  SELECT token, escritorio_id INTO v_token, v_escritorio
  FROM public.colaborador_convites
  WHERE id = _convite_id
    AND usado = false
    AND expira_em > now();

  IF v_token IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  IF v_escritorio IS DISTINCT FROM public.get_user_escritorio_id()
     OR NOT public.has_role(auth.uid(), 'dono'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.get_colaborador_convite_token(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_colaborador_convite_token(uuid) TO authenticated;

-- 3) Política explícita de INSERT no audit_logs para o service_role (clareza/intenção).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
      AND policyname = 'service_role can insert audit logs'
  ) THEN
    CREATE POLICY "service_role can insert audit logs"
      ON public.audit_logs
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;
