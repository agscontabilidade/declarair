-- Marca itens antigos do checklist sem arquivo como não obrigatórios
UPDATE public.checklist_documentos
   SET obrigatorio = false
 WHERE obrigatorio = true
   AND (arquivo_url IS NULL OR status = 'pendente');

-- Remove o trigger que reverte declaração ao apagar arquivos.
-- Documentos agora são livres: remover arquivo não deve voltar a declaração
-- para 'aguardando_documentos'.
DROP TRIGGER IF EXISTS trg_auto_revert_declaracao_status ON public.checklist_documentos;