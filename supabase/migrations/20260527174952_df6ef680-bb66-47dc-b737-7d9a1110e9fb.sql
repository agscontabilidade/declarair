
-- 1) Revoke column-level SELECT on sensitive token columns
REVOKE SELECT (token_convite, token_convite_expira_em) ON public.clientes FROM authenticated, anon;
REVOKE SELECT (token) ON public.convites_cliente FROM authenticated, anon;

-- 2) Restrict usuario_permissoes management to dono only
DROP POLICY IF EXISTS "Accountants can manage permissions of their office" ON public.usuario_permissoes;

CREATE POLICY "Only dono can manage office permissions"
ON public.usuario_permissoes
FOR ALL
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::app_role)
  AND user_id <> auth.uid()
)
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::app_role)
  AND user_id <> auth.uid()
);
