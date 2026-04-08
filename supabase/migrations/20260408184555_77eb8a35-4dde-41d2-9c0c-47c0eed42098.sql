-- 1. Fix usuarios self-update race condition: use a trigger to protect papel and escritorio_id
DROP POLICY IF EXISTS "Usuario pode atualizar proprio registro" ON public.usuarios;

CREATE POLICY "Usuario pode atualizar proprio registro"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.protect_usuario_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role to bypass
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- If user is updating their own record
  IF OLD.id = auth.uid() THEN
    -- Prevent papel change
    IF OLD.papel IS DISTINCT FROM NEW.papel THEN
      RAISE EXCEPTION 'Users cannot change their own role';
    END IF;
    -- Prevent escritorio_id change
    IF OLD.escritorio_id IS DISTINCT FROM NEW.escritorio_id THEN
      RAISE EXCEPTION 'Users cannot change their own office';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_usuario_role_change ON public.usuarios;
CREATE TRIGGER protect_usuario_role_change
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.protect_usuario_role_change();

-- 2. Fix bug_reports admin update: restrict identity fields
DROP POLICY IF EXISTS "Admin pode atualizar bug reports" ON public.bug_reports;

CREATE POLICY "Admin pode atualizar bug reports"
ON public.bug_reports
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND reportado_por = ( SELECT br.reportado_por FROM public.bug_reports br WHERE br.id = bug_reports.id )
  AND COALESCE(reportado_por_email, '') = COALESCE(( SELECT br.reportado_por_email FROM public.bug_reports br WHERE br.id = bug_reports.id ), '')
  AND COALESCE(escritorio_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(( SELECT br.escritorio_id FROM public.bug_reports br WHERE br.id = bug_reports.id ), '00000000-0000-0000-0000-000000000000'::uuid)
);