
-- 1) Remover bloqueio antigo que afetava contador ao criar clientes
DROP TRIGGER IF EXISTS trg_enforce_novos_cadastros_bloqueio ON public.clientes;
DROP FUNCTION IF EXISTS public.enforce_novos_cadastros_bloqueio();

-- 2) Renomear/atualizar chave de configuração
UPDATE public.system_configs
SET key = 'cliente_upload_bloqueado',
    value = jsonb_build_object(
      'enabled', true,
      'deadline', '2026-05-26T19:00:00-03:00',
      'mensagem', 'O envio de novos documentos pelo portal do cliente foi encerrado em 26/05/2026 às 19:00 devido ao prazo final da Receita Federal. Entre em contato com seu contador para tratar qualquer pendência.'
    ),
    updated_at = now()
WHERE key = 'novos_cadastros_bloqueio';

-- Se ainda não existir, insere
INSERT INTO public.system_configs (key, value)
SELECT 'cliente_upload_bloqueado',
  jsonb_build_object(
    'enabled', true,
    'deadline', '2026-05-26T19:00:00-03:00',
    'mensagem', 'O envio de novos documentos pelo portal do cliente foi encerrado em 26/05/2026 às 19:00 devido ao prazo final da Receita Federal. Entre em contato com seu contador para tratar qualquer pendência.'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.system_configs WHERE key = 'cliente_upload_bloqueado'
);

-- 3) Atualizar RPC para apontar para a nova chave
CREATE OR REPLACE FUNCTION public.get_novos_cadastros_bloqueio()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT value
  FROM public.system_configs
  WHERE key = 'cliente_upload_bloqueado'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_cliente_upload_bloqueio()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT value
  FROM public.system_configs
  WHERE key = 'cliente_upload_bloqueado'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_cliente_upload_bloqueio() TO authenticated, anon;

-- 4) Função/trigger que bloqueia apenas INSERTs feitos por clientes
CREATE OR REPLACE FUNCTION public.enforce_cliente_upload_bloqueio()
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
  v_role text;
  v_claims text;
  v_is_cliente boolean := false;
BEGIN
  -- service_role passa direto (edge functions, jobs)
  BEGIN
    v_role := auth.role();
  EXCEPTION WHEN OTHERS THEN v_role := NULL;
  END;
  IF v_role = 'service_role' THEN RETURN NEW; END IF;

  BEGIN
    v_claims := current_setting('request.jwt.claims', true);
    IF v_claims IS NOT NULL AND (v_claims::jsonb ->> 'role') = 'service_role' THEN
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- Sem usuário autenticado: não bloqueia
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  -- Contador/colaborador (linha em usuarios): não bloqueia
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Cliente (linha em clientes): aplica regra
  SELECT EXISTS (SELECT 1 FROM public.clientes WHERE auth_user_id = auth.uid())
    INTO v_is_cliente;
  IF NOT v_is_cliente THEN RETURN NEW; END IF;

  SELECT value INTO v_cfg
  FROM public.system_configs
  WHERE key = 'cliente_upload_bloqueado'
  LIMIT 1;

  IF v_cfg IS NULL THEN RETURN NEW; END IF;

  v_enabled := COALESCE((v_cfg->>'enabled')::boolean, false);
  IF NOT v_enabled THEN RETURN NEW; END IF;

  BEGIN
    v_deadline := (v_cfg->>'deadline')::timestamptz;
  EXCEPTION WHEN OTHERS THEN v_deadline := NULL;
  END;

  IF v_deadline IS NULL OR now() < v_deadline THEN RETURN NEW; END IF;

  v_mensagem := COALESCE(
    v_cfg->>'mensagem',
    'O envio de novos documentos pelo portal do cliente foi encerrado. Entre em contato com seu contador.'
  );

  RAISE EXCEPTION 'CLIENTE_UPLOAD_BLOQUEADO: %', v_mensagem
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_cliente_upload_bloqueio ON public.checklist_documentos;
CREATE TRIGGER trg_enforce_cliente_upload_bloqueio
BEFORE INSERT ON public.checklist_documentos
FOR EACH ROW
EXECUTE FUNCTION public.enforce_cliente_upload_bloqueio();
