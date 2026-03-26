CREATE POLICY "Permitir insert ao criar conta"
ON escritorios
FOR INSERT
TO authenticated
WITH CHECK (public.get_user_escritorio_id() IS NULL);