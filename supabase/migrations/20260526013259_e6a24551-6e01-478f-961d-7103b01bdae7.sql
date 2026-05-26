CREATE OR REPLACE FUNCTION public.protect_cliente_sensitive_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_role text;
  v_claims text;
BEGIN
  -- 1) service_role (edge functions com SERVICE_ROLE_KEY) passa direto
  BEGIN
    v_role := auth.role();
  EXCEPTION WHEN OTHERS THEN
    v_role := NULL;
  END;

  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_claims := current_setting('request.jwt.claims', true);
    IF v_claims IS NOT NULL AND (v_claims::jsonb ->> 'role') = 'service_role' THEN
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 2) Se não houver auth.uid (contexto interno/cron), passa direto
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3) auth_user_id só pode ser alterado por dono/admin
  IF OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id THEN
    IF NOT (has_role(auth.uid(), 'dono'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
      RAISE EXCEPTION 'Only owners can modify auth_user_id';
    END IF;
  END IF;

  -- 4) token_convite só pode ser alterado por dono/admin
  IF OLD.token_convite IS DISTINCT FROM NEW.token_convite THEN
    IF NOT (has_role(auth.uid(), 'dono'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
      RAISE EXCEPTION 'Only owners can modify token_convite';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;