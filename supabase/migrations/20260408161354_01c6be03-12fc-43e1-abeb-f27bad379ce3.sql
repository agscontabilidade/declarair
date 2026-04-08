DROP POLICY IF EXISTS "Contador ver docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador update docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador deletar docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente ver docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente deletar docs" ON storage.objects;

CREATE POLICY "Contador ver docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text);

CREATE POLICY "Contador upload docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text);

CREATE POLICY "Contador update docs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text)
WITH CHECK (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text);

CREATE POLICY "Contador deletar docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text);

CREATE POLICY "Cliente ver docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[2] = public.get_user_cliente_id()::text);

CREATE POLICY "Cliente upload docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[2] = public.get_user_cliente_id()::text);

CREATE POLICY "Cliente deletar docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos-clientes' AND (storage.foldername(name))[2] = public.get_user_cliente_id()::text);