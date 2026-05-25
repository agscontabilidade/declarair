
-- 1. INSERT em declaracoes pelo cliente (apenas para o próprio cliente_id)
CREATE POLICY "Cliente pode criar sua declaracao"
ON public.declaracoes
FOR INSERT
TO authenticated
WITH CHECK (cliente_id = public.get_user_cliente_id());

-- 2. UPDATE em declaracoes pelo cliente (apenas a própria)
CREATE POLICY "Cliente pode atualizar sua declaracao"
ON public.declaracoes
FOR UPDATE
TO authenticated
USING (cliente_id = public.get_user_cliente_id())
WITH CHECK (cliente_id = public.get_user_cliente_id());

-- 2b. Trigger restringe quais colunas o cliente pode alterar
CREATE OR REPLACE FUNCTION public.restrict_cliente_declaracao_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Service role e contador (usuario com escritorio) passam direto
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.get_user_escritorio_id() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se chegou aqui, é cliente. Bloqueia mudança em campos sensíveis.
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
     OR NEW.arquivo_recibo_url IS DISTINCT FROM OLD.arquivo_recibo_url
     OR NEW.arquivo_mei_url IS DISTINCT FROM OLD.arquivo_mei_url
     OR NEW.arquivo_darf_url IS DISTINCT FROM OLD.arquivo_darf_url
     OR NEW.arquivo_analise_caixa_url IS DISTINCT FROM OLD.arquivo_analise_caixa_url
  THEN
    RAISE EXCEPTION 'Cliente nao pode alterar campos sensiveis da declaracao';
  END IF;

  -- Cliente só transita status entre estes valores permitidos
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('aguardando_documentos', 'documentacao_recebida')
  THEN
    RAISE EXCEPTION 'Cliente nao pode definir status %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_cliente_declaracao_update ON public.declaracoes;
CREATE TRIGGER trg_restrict_cliente_declaracao_update
BEFORE UPDATE ON public.declaracoes
FOR EACH ROW
EXECUTE FUNCTION public.restrict_cliente_declaracao_update();

-- 3. INSERT em notificacoes pelo cliente (apenas para o próprio escritorio do cliente)
CREATE POLICY "Cliente pode notificar seu escritorio"
ON public.notificacoes
FOR INSERT
TO authenticated
WITH CHECK (
  escritorio_id IS NOT NULL
  AND escritorio_id = public.get_user_cliente_escritorio_id()
);

-- 4. Mensagem mais clara no enforce de limite
CREATE OR REPLACE FUNCTION public.enforce_declaracao_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_limit INTEGER;
    v_count INTEGER;
BEGIN
    SELECT limite_declaracoes INTO v_limit
    FROM public.escritorios
    WHERE id = NEW.escritorio_id
    FOR SHARE;

    SELECT COUNT(*) INTO v_count
    FROM public.declaracoes
    WHERE escritorio_id = NEW.escritorio_id;

    IF v_count >= v_limit THEN
        RAISE EXCEPTION 'LIMITE_PLANO_ATINGIDO: O escritorio atingiu o limite de declaracoes do plano (%/%). Peca ao contador para liberar mais uma declaracao.', v_count, v_limit;
    END IF;

    RETURN NEW;
END;
$$;
