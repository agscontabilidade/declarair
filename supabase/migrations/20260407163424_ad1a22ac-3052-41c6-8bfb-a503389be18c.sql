DROP POLICY IF EXISTS "Escritorio pode gerenciar seus convites" ON public.convites_cliente;

CREATE POLICY "Dono pode ver convites do escritorio"
ON public.convites_cliente
FOR SELECT
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::public.app_role)
);

CREATE POLICY "Dono pode criar convites do escritorio"
ON public.convites_cliente
FOR INSERT
TO authenticated
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::public.app_role)
);

CREATE POLICY "Dono pode atualizar convites do escritorio"
ON public.convites_cliente
FOR UPDATE
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::public.app_role)
)
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::public.app_role)
);

CREATE POLICY "Dono pode remover convites do escritorio"
ON public.convites_cliente
FOR DELETE
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::public.app_role)
);