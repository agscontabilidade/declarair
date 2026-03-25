
-- FIX: Restrict escritorios INSERT to service_role only
-- The handle_new_accountant_signup function (SECURITY DEFINER) handles creation
DROP POLICY IF EXISTS "Permitir insert ao criar conta" ON public.escritorios;

CREATE POLICY "Service role insere escritorios"
ON public.escritorios
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role'::text);
