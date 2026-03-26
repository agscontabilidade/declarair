-- Auto-increment declaracoes_utilizadas when a new declaration is created
CREATE OR REPLACE FUNCTION public.incrementar_declaracoes_utilizadas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.escritorios
  SET declaracoes_utilizadas = COALESCE(declaracoes_utilizadas, 0) + 1
  WHERE id = NEW.escritorio_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_incrementar_declaracoes
  AFTER INSERT ON public.declaracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.incrementar_declaracoes_utilizadas();

-- Auto-decrement when a declaration is deleted
CREATE OR REPLACE FUNCTION public.decrementar_declaracoes_utilizadas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.escritorios
  SET declaracoes_utilizadas = GREATEST(COALESCE(declaracoes_utilizadas, 0) - 1, 0)
  WHERE id = OLD.escritorio_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_decrementar_declaracoes
  AFTER DELETE ON public.declaracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrementar_declaracoes_utilizadas();