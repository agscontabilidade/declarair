
-- Tabela de declarações extras (compra avulsa)
CREATE TABLE IF NOT EXISTS public.declaracoes_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escritorio_id UUID NOT NULL REFERENCES public.escritorios(id) ON DELETE CASCADE,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL DEFAULT 9.90,
  valor_total DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  mes_referencia DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW())::date,
  cobranca_id UUID REFERENCES public.cobrancas(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declaracoes_extras_escritorio ON public.declaracoes_extras(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_declaracoes_extras_mes ON public.declaracoes_extras(mes_referencia);

ALTER TABLE public.declaracoes_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escritorio ve suas declaracoes extras"
ON public.declaracoes_extras
FOR SELECT
TO authenticated
USING (escritorio_id = public.get_user_escritorio_id());

CREATE POLICY "Dono insere declaracoes extras"
ON public.declaracoes_extras
FOR INSERT
TO authenticated
WITH CHECK (escritorio_id = public.get_user_escritorio_id() AND public.has_role(auth.uid(), 'dono'));

CREATE POLICY "Service role full access declaracoes_extras"
ON public.declaracoes_extras
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Função para contar declarações ativas no ano
CREATE OR REPLACE FUNCTION public.count_declaracoes_ativas(escritorio_uuid UUID)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.declaracoes
    WHERE escritorio_id = escritorio_uuid
      AND status != 'arquivada'
      AND ano_base = EXTRACT(YEAR FROM NOW())::int - 1
  );
END;
$$;

-- Função para verificar se pode criar declaração
CREATE OR REPLACE FUNCTION public.check_can_create_declaracao(escritorio_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    v_limite := 3;
  END IF;

  -- Pro = ilimitado
  IF v_plano IN ('pro', 'profissional') THEN
    RETURN TRUE;
  END IF;

  -- Contar ativas
  v_ativas := public.count_declaracoes_ativas(escritorio_uuid);

  RETURN v_ativas < COALESCE(v_limite, 3);
END;
$$;
