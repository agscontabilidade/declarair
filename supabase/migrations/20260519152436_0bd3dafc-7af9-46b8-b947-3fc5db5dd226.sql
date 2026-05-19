-- =============================================================
-- Fase 8b: limpeza de índices redundantes + search_path hardening
-- =============================================================
--
-- REVERSÃO (caso necessário):
--   CREATE INDEX idx_clientes_escritorio_id ON public.clientes USING btree (escritorio_id);
--   CREATE INDEX idx_declaracoes_status     ON public.declaracoes USING btree (status);
--
-- Ambos são cobertos por índices compostos existentes; remover apenas
-- reduz overhead de escrita e espaço em disco.

DROP INDEX IF EXISTS public.idx_clientes_escritorio_id;
DROP INDEX IF EXISTS public.idx_declaracoes_status;

-- ---------------------------------------------------------------
-- Hardening: fixar search_path nas funções de trigger genéricas
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_system_configs_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;