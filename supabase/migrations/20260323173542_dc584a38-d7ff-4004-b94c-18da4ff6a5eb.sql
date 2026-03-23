CREATE POLICY "Contador upload docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-clientes' AND (SELECT public.get_user_escritorio_id()) IS NOT NULL);

CREATE POLICY "Contador ver docs" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documentos-clientes' AND (SELECT public.get_user_escritorio_id()) IS NOT NULL);

CREATE POLICY "Contador deletar docs" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documentos-clientes' AND (SELECT public.get_user_escritorio_id()) IS NOT NULL);

CREATE POLICY "Contador update docs" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documentos-clientes' AND (SELECT public.get_user_escritorio_id()) IS NOT NULL)
WITH CHECK (bucket_id = 'documentos-clientes' AND (SELECT public.get_user_escritorio_id()) IS NOT NULL);