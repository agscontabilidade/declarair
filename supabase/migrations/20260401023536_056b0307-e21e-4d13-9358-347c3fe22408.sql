
-- 1) Allow clients to insert checklist items for their own declarations
CREATE POLICY "Cliente pode inserir checklist"
ON public.checklist_documentos
FOR INSERT
TO authenticated
WITH CHECK (
  declaracao_id IN (
    SELECT id FROM declaracoes WHERE cliente_id = get_user_cliente_id()
  )
);

-- 2) Add chave_pix_cliente column to formulario_ir
ALTER TABLE public.formulario_ir
ADD COLUMN chave_pix_cliente TEXT DEFAULT NULL;
