
-- 1) Função: avança status automaticamente ao receber documentos
CREATE OR REPLACE FUNCTION public.auto_advance_declaracao_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'recebido' THEN
    UPDATE public.declaracoes
       SET status = 'documentacao_recebida',
           status_documentos = 'enviado',
           ultima_atualizacao_status = now()
     WHERE id = NEW.declaracao_id
       AND status = 'aguardando_documentos';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_advance_declaracao_status ON public.checklist_documentos;
CREATE TRIGGER trg_auto_advance_declaracao_status
AFTER INSERT OR UPDATE OF status ON public.checklist_documentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_advance_declaracao_status();

-- 2) Função: reverte status se todos os documentos forem removidos
CREATE OR REPLACE FUNCTION public.auto_revert_declaracao_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_restantes integer;
  v_status_atual text;
BEGIN
  SELECT status INTO v_status_atual
    FROM public.declaracoes
   WHERE id = OLD.declaracao_id;

  IF v_status_atual <> 'documentacao_recebida' THEN
    RETURN OLD;
  END IF;

  SELECT count(*) INTO v_restantes
    FROM public.checklist_documentos
   WHERE declaracao_id = OLD.declaracao_id
     AND status = 'recebido';

  IF v_restantes = 0 THEN
    UPDATE public.declaracoes
       SET status = 'aguardando_documentos',
           status_documentos = 'pendente',
           ultima_atualizacao_status = now()
     WHERE id = OLD.declaracao_id
       AND status = 'documentacao_recebida';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_revert_declaracao_status ON public.checklist_documentos;
CREATE TRIGGER trg_auto_revert_declaracao_status
AFTER DELETE ON public.checklist_documentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_revert_declaracao_status();

-- 3) Backfill: corrige declarações travadas
UPDATE public.declaracoes d
   SET status = 'documentacao_recebida',
       status_documentos = 'enviado',
       ultima_atualizacao_status = now()
 WHERE d.status = 'aguardando_documentos'
   AND EXISTS (
     SELECT 1 FROM public.checklist_documentos cd
      WHERE cd.declaracao_id = d.id
        AND cd.status = 'recebido'
   );
