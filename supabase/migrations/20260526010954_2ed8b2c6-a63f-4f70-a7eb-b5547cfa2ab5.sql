CREATE OR REPLACE FUNCTION public.validar_token_convite_cliente(_token uuid)
RETURNS TABLE(
  status text,
  cliente_id uuid,
  nome text,
  email text,
  escritorio_id uuid,
  escritorio_nome text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _cliente record;
BEGIN
  SELECT c.id, c.nome, c.email, c.escritorio_id, c.status_onboarding, c.token_convite_expira_em
    INTO _cliente
  FROM public.clientes c
  WHERE c.token_convite = _token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'inexistente'::text, NULL::uuid, NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF _cliente.status_onboarding = 'concluido' THEN
    RETURN QUERY SELECT 'concluido'::text, _cliente.id, _cliente.nome, _cliente.email, _cliente.escritorio_id,
      (SELECT e.nome FROM public.escritorios e WHERE e.id = _cliente.escritorio_id);
    RETURN;
  END IF;

  IF _cliente.token_convite_expira_em IS NULL OR _cliente.token_convite_expira_em <= now() THEN
    RETURN QUERY SELECT 'expirado'::text, _cliente.id, _cliente.nome, _cliente.email, _cliente.escritorio_id,
      (SELECT e.nome FROM public.escritorios e WHERE e.id = _cliente.escritorio_id);
    RETURN;
  END IF;

  RETURN QUERY SELECT 'valido'::text, _cliente.id, _cliente.nome, _cliente.email, _cliente.escritorio_id,
    (SELECT e.nome FROM public.escritorios e WHERE e.id = _cliente.escritorio_id);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.validar_token_convite_cliente(uuid) TO anon, authenticated;