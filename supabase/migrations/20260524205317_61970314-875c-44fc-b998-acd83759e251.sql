DROP POLICY IF EXISTS "Contador ver docs v2" ON storage.objects;
DROP POLICY IF EXISTS "Contador upload docs v2" ON storage.objects;
DROP POLICY IF EXISTS "Contador update docs v2" ON storage.objects;
DROP POLICY IF EXISTS "Contador deletar docs v2" ON storage.objects;

CREATE POLICY "Contador ver docs v2"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

CREATE POLICY "Contador upload docs v2"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

CREATE POLICY "Contador update docs v2"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
)
WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

CREATE POLICY "Contador deletar docs v2"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

DROP POLICY IF EXISTS "Cliente update docs v2" ON storage.objects;
CREATE POLICY "Cliente update docs v2"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (get_user_cliente_escritorio_id())::text
  AND (storage.foldername(name))[2] = (get_user_cliente_id())::text
)
WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (get_user_cliente_escritorio_id())::text
  AND (storage.foldername(name))[2] = (get_user_cliente_id())::text
);