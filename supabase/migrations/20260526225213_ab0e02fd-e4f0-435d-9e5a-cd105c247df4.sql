
-- 1) Config global da trava
INSERT INTO public.system_configs (key, value, description, category)
VALUES (
  'novos_cadastros_bloqueio',
  jsonb_build_object(
    'enabled', true,
    'deadline', '2026-05-26T19:00:00-03:00',
    'mensagem', 'O cadastro de novos clientes está encerrado desde 26/05/2026 às 19h00 (horário de Brasília), respeitando o prazo final do IRPF. Clientes já cadastrados continuam com acesso normal à plataforma.'
  ),
  'Bloqueia a criação de novos clientes após a data limite (prazo IRPF). Não afeta clientes já cadastrados.',
  'system'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    updated_at = now();

-- 2) Função e trigger BEFORE INSERT em public.clientes
CREATE OR REPLACE FUNCTION public.enforce_novos_cadastros_bloqueio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_cfg jsonb;
  v_enabled boolean;
  v_deadline timestamptz;
  v_mensagem text;
BEGIN
  SELECT value INTO v_cfg
  FROM public.system_configs
  WHERE key = 'novos_cadastros_bloqueio'
  LIMIT 1;

  IF v_cfg IS NULL THEN
    RETURN NEW;
  END IF;

  v_enabled := COALESCE((v_cfg->>'enabled')::boolean, false);
  IF NOT v_enabled THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_deadline := (v_cfg->>'deadline')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    v_deadline := NULL;
  END;

  IF v_deadline IS NULL OR now() < v_deadline THEN
    RETURN NEW;
  END IF;

  v_mensagem := COALESCE(
    v_cfg->>'mensagem',
    'O cadastro de novos clientes foi encerrado. Clientes já cadastrados continuam com acesso normal.'
  );

  RAISE EXCEPTION 'NOVOS_CADASTROS_BLOQUEADOS: %', v_mensagem
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_novos_cadastros_bloqueio ON public.clientes;
CREATE TRIGGER trg_enforce_novos_cadastros_bloqueio
BEFORE INSERT ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_novos_cadastros_bloqueio();

-- 3) RPC pública para o frontend ler o status da trava
--    (system_configs tem RLS só para admin; precisamos de um acesso público de leitura
--    apenas dos campos necessários para exibir a UI)
CREATE OR REPLACE FUNCTION public.get_novos_cadastros_bloqueio()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT value
  FROM public.system_configs
  WHERE key = 'novos_cadastros_bloqueio'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_novos_cadastros_bloqueio() TO anon, authenticated;
