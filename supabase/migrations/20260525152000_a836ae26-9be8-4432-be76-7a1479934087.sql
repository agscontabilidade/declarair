-- Tighten convites_cliente RLS: only dono (Responsável Técnico) can manage client invite tokens
DROP POLICY IF EXISTS "Colaboradores podem ver convites do escritorio" ON public.convites_cliente;
DROP POLICY IF EXISTS "Colaboradores podem criar convites do escritorio" ON public.convites_cliente;
DROP POLICY IF EXISTS "Colaboradores podem atualizar convites do escritorio" ON public.convites_cliente;
DROP POLICY IF EXISTS "Colaboradores podem remover convites do escritorio" ON public.convites_cliente;

CREATE POLICY "Dono ve convites do escritorio"
  ON public.convites_cliente FOR SELECT
  TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'::app_role));

CREATE POLICY "Dono cria convites do escritorio"
  ON public.convites_cliente FOR INSERT
  TO authenticated
  WITH CHECK (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'::app_role));

CREATE POLICY "Dono atualiza convites do escritorio"
  ON public.convites_cliente FOR UPDATE
  TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'::app_role))
  WITH CHECK (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'::app_role));

CREATE POLICY "Dono remove convites do escritorio"
  ON public.convites_cliente FOR DELETE
  TO authenticated
  USING (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'::app_role));