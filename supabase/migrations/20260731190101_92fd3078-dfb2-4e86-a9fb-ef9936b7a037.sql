CREATE POLICY "Cliente ver declaracao e recibo da propria declaracao"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (public.get_user_cliente_escritorio_id())::text
  AND (storage.foldername(name))[2] = 'declaracoes'
  AND EXISTS (
    SELECT 1 FROM public.declaracoes d
    WHERE d.cliente_id = public.get_user_cliente_id()
      AND d.id::text = (storage.foldername(name))[3]
      AND (d.arquivo_declaracao_url = storage.objects.name OR d.arquivo_recibo_url = storage.objects.name)
  )
);