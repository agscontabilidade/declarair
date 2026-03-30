CREATE OR REPLACE FUNCTION public.protect_cliente_sensitive_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role to bypass (edge functions use service_role for admin operations)
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- If auth_user_id is being changed, only allow dono
  IF OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id THEN
    IF NOT has_role(auth.uid(), 'dono') THEN
      RAISE EXCEPTION 'Only owners can modify auth_user_id';
    END IF;
  END IF;
  -- If token_convite is being changed, only allow dono
  IF OLD.token_convite IS DISTINCT FROM NEW.token_convite THEN
    IF NOT has_role(auth.uid(), 'dono') THEN
      RAISE EXCEPTION 'Only owners can modify token_convite';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;