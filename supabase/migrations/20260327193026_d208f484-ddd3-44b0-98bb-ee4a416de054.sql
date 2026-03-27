
-- Update default limits for free plan: 1 declaration, 500MB storage
ALTER TABLE public.escritorios ALTER COLUMN limite_declaracoes SET DEFAULT 1;
ALTER TABLE public.escritorios ALTER COLUMN storage_limite_mb SET DEFAULT 500;
ALTER TABLE public.escritorios ALTER COLUMN usuarios_limite SET DEFAULT 1;

-- Update check_can_create_declaracao to use new free limit of 1
CREATE OR REPLACE FUNCTION public.check_can_create_declaracao(escritorio_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plano TEXT;
  v_limite INT;
  v_ativas INT;
BEGIN
  SELECT plano, limite_declaracoes
  INTO v_plano, v_limite
  FROM public.escritorios
  WHERE id = escritorio_uuid;

  IF v_plano IS NULL THEN
    v_plano := 'gratuito';
    v_limite := 1;
  END IF;

  -- Pro has a limit too (3 base), but can buy extras
  -- Check against the actual limite_declaracoes column
  v_ativas := public.count_declaracoes_ativas(escritorio_uuid);

  RETURN v_ativas < COALESCE(v_limite, 1);
END;
$function$;
