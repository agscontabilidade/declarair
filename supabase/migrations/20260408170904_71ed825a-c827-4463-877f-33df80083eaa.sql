-- Fix webhook secrets exposure: restrict SELECT to dono only
DROP POLICY IF EXISTS "Escritorio ve webhooks" ON public.webhooks;

CREATE POLICY "Dono ve webhooks"
  ON public.webhooks
  FOR SELECT
  TO authenticated
  USING (
    escritorio_id = get_user_escritorio_id()
    AND has_role(auth.uid(), 'dono'::app_role)
  );