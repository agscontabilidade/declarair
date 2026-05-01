-- 1. Migrar todas as declarações existentes para 2026
UPDATE public.declaracoes SET ano_base = 2026 WHERE ano_base <> 2026;
UPDATE public.formulario_ir SET ano_base = 2026 WHERE ano_base <> 2026;

-- 2. Ajustar função para usar ano atual (não mais ano - 1)
CREATE OR REPLACE FUNCTION public.count_declaracoes_ativas(escritorio_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.declaracoes
    WHERE escritorio_id = escritorio_uuid
      AND status != 'arquivada'
      AND ano_base = EXTRACT(YEAR FROM NOW())::int
  );
END;
$function$;