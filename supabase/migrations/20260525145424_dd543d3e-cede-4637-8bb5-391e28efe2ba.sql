CREATE OR REPLACE FUNCTION public.dashboard_kpis(p_escritorio_id uuid, p_ano_base int)
RETURNS TABLE(total_clientes int, em_andamento int, doc_pendente int, transmitidas int)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Tenant guard: caller must belong to the escritório (or be admin)
  IF p_escritorio_id IS DISTINCT FROM public.get_user_escritorio_id()
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::int FROM public.clientes c WHERE c.escritorio_id = p_escritorio_id),
    (SELECT COUNT(*)::int FROM public.declaracoes d
       WHERE d.escritorio_id = p_escritorio_id AND d.ano_base = p_ano_base AND d.status <> 'transmitida'),
    (SELECT COUNT(*)::int FROM public.declaracoes d
       WHERE d.escritorio_id = p_escritorio_id AND d.ano_base = p_ano_base AND d.status = 'aguardando_documentos'),
    (SELECT COUNT(*)::int FROM public.declaracoes d
       WHERE d.escritorio_id = p_escritorio_id AND d.ano_base = p_ano_base AND d.status = 'transmitida');
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_kpis(uuid, int) TO authenticated;