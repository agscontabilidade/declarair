-- 1. Restrict clientes.token_convite visibility via column-level revoke
REVOKE SELECT (token_convite, token_convite_expira_em) ON public.clientes FROM authenticated, anon;

-- Provide a secure way for dono to fetch a client's invite token (for reuse)
CREATE OR REPLACE FUNCTION public.get_cliente_invite_token(_cliente_id uuid)
RETURNS TABLE(token_convite uuid, token_convite_expira_em timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.token_convite, c.token_convite_expira_em
  FROM public.clientes c
  WHERE c.id = _cliente_id
    AND c.escritorio_id = public.get_user_escritorio_id()
    AND public.has_role(auth.uid(), 'dono'::app_role);
$$;

REVOKE ALL ON FUNCTION public.get_cliente_invite_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cliente_invite_token(uuid) TO authenticated;

-- 2. Remove user_roles fallback from get_user_papel (prevent privilege escalation
--    via user_roles which is intended for system admins only)
CREATE OR REPLACE FUNCTION public.get_user_papel()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.papel FROM public.usuarios u WHERE u.id = auth.uid()
$$;

-- 3. Tighten mensagens_chat: split ALL policy so colaboradores only see chats
--    for clients assigned to them (donos still see all in escritorio).
DROP POLICY IF EXISTS "Acesso chat por escritorio" ON public.mensagens_chat;

CREATE POLICY "Dono ve todo chat do escritorio"
ON public.mensagens_chat
FOR SELECT
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::app_role)
);

CREATE POLICY "Colaborador ve chat dos clientes atribuidos"
ON public.mensagens_chat
FOR SELECT
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND NOT public.has_role(auth.uid(), 'dono'::app_role)
  AND cliente_id IN (
    SELECT c.id FROM public.clientes c
    WHERE c.contador_responsavel_id = auth.uid()
  )
);

CREATE POLICY "Contador insere chat do escritorio"
ON public.mensagens_chat
FOR INSERT
TO authenticated
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND (
    public.has_role(auth.uid(), 'dono'::app_role)
    OR cliente_id IN (
      SELECT c.id FROM public.clientes c
      WHERE c.contador_responsavel_id = auth.uid()
    )
  )
);

CREATE POLICY "Contador atualiza chat do escritorio"
ON public.mensagens_chat
FOR UPDATE
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND (
    public.has_role(auth.uid(), 'dono'::app_role)
    OR cliente_id IN (
      SELECT c.id FROM public.clientes c
      WHERE c.contador_responsavel_id = auth.uid()
    )
  )
);

CREATE POLICY "Dono deleta chat do escritorio"
ON public.mensagens_chat
FOR DELETE
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::app_role)
);