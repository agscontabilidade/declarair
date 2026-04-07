
-- 1. Create trigger function to enforce declaration limits
CREATE OR REPLACE FUNCTION public.enforce_declaracao_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limite INT;
  v_ativas INT;
BEGIN
  SELECT COALESCE(limite_declaracoes, 1)
  INTO v_limite
  FROM public.escritorios
  WHERE id = NEW.escritorio_id;

  v_ativas := public.count_declaracoes_ativas(NEW.escritorio_id);

  IF v_ativas >= v_limite THEN
    RAISE EXCEPTION 'Limite de declarações atingido (% de %)', v_ativas, v_limite
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trg_enforce_declaracao_limit ON public.declaracoes;
CREATE TRIGGER trg_enforce_declaracao_limit
  BEFORE INSERT ON public.declaracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_declaracao_limit();

-- 3. Fix declaracoes_extras default valor_unitario
ALTER TABLE public.declaracoes_extras
  ALTER COLUMN valor_unitario SET DEFAULT 4.90;
