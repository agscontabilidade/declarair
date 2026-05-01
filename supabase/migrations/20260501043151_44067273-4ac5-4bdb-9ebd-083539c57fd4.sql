
-- Trigger function: atualiza ultima_atualizacao_status em qualquer UPDATE
CREATE OR REPLACE FUNCTION public.touch_declaracao_ultima_atualizacao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.ultima_atualizacao_status = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_declaracao_ultima_atualizacao ON public.declaracoes;
CREATE TRIGGER trg_touch_declaracao_ultima_atualizacao
BEFORE UPDATE ON public.declaracoes
FOR EACH ROW
EXECUTE FUNCTION public.touch_declaracao_ultima_atualizacao();

-- Garantir REPLICA IDENTITY FULL para realtime
ALTER TABLE public.declaracoes REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime (ignorar se já estiver)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.declaracoes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
