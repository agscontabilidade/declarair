CREATE OR REPLACE FUNCTION public.restrict_cliente_declaracao_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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

  -- Fallbacks de detecção do role (compatibilidade entre versões do PostgREST)
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

  -- 2) contador / colaborador (linha em public.usuarios) passa direto
  IF public.get_user_escritorio_id() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 3) admin global também passa
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- 4) restante = cliente: aplica restrições originais (campos + status)
  IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
     OR NEW.escritorio_id IS DISTINCT FROM OLD.escritorio_id
     OR NEW.contador_id IS DISTINCT FROM OLD.contador_id
     OR NEW.ano_base IS DISTINCT FROM OLD.ano_base
     OR NEW.tipo_resultado IS DISTINCT FROM OLD.tipo_resultado
     OR NEW.valor_resultado IS DISTINCT FROM OLD.valor_resultado
     OR NEW.numero_recibo IS DISTINCT FROM OLD.numero_recibo
     OR NEW.data_transmissao IS DISTINCT FROM OLD.data_transmissao
     OR NEW.forma_tributacao IS DISTINCT FROM OLD.forma_tributacao
     OR NEW.observacoes_internas IS DISTINCT FROM OLD.observacoes_internas
     OR NEW.arquivo_declaracao_url IS DISTINCT FROM OLD.arquivo_declaracao_url
     OR NEW.arquivo_recibo_url    IS DISTINCT FROM OLD.arquivo_recibo_url
     OR NEW.arquivo_mei_url       IS DISTINCT FROM OLD.arquivo_mei_url
     OR NEW.arquivo_darf_url      IS DISTINCT FROM OLD.arquivo_darf_url
     OR NEW.arquivo_analise_caixa_url IS DISTINCT FROM OLD.arquivo_analise_caixa_url
  THEN
    RAISE EXCEPTION 'Cliente nao pode alterar campos sensiveis da declaracao';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('aguardando_documentos', 'documentacao_recebida')
  THEN
    RAISE EXCEPTION 'Cliente nao pode definir status %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;