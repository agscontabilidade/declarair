
-- Allow clients to upload documents to the documentos-clientes bucket
CREATE POLICY "Cliente upload docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (SELECT get_user_cliente_id()) IS NOT NULL
);

-- Allow clients to view/download their own documents
CREATE POLICY "Cliente ver docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (SELECT get_user_cliente_id()) IS NOT NULL
);
