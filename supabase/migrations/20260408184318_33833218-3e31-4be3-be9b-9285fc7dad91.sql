DROP POLICY IF EXISTS "Admin pode gerenciar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only service_role can insert roles" ON public.user_roles;

CREATE POLICY "Service role insere roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role atualiza roles"
ON public.user_roles
FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role remove roles"
ON public.user_roles
FOR DELETE
TO public
USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Malha fina select by role" ON public.malha_fina_consultas;

CREATE POLICY "Malha fina select by role"
ON public.malha_fina_consultas
FOR SELECT
TO authenticated
USING (
  escritorio_id = get_user_escritorio_id()
  AND (
    has_role(auth.uid(), 'dono'::app_role)
    OR cliente_id IN (
      SELECT c.id
      FROM public.clientes c
      WHERE c.escritorio_id = get_user_escritorio_id()
        AND c.contador_responsavel_id = auth.uid()
    )
  )
);