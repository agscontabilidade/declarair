
-- Allow clients to delete their own checklist items (for regeneration)
CREATE POLICY "Cliente pode deletar seu checklist"
ON public.checklist_documentos
FOR DELETE
TO authenticated
USING (
  declaracao_id IN (
    SELECT id FROM declaracoes WHERE cliente_id = get_user_cliente_id()
  )
);
