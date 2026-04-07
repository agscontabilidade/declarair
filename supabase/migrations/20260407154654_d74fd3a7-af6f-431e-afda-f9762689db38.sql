
-- Drop existing overly permissive policies on documentos-clientes
DROP POLICY IF EXISTS "Contador ver docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador update docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador deletar docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente ver docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente upload docs" ON storage.objects;

-- Recreate with proper path-scoped policies
-- Path format: {escritorio_id}/{cliente_id}/{doc_id}/{filename}

-- Contador SELECT: must match their escritorio_id in path
CREATE POLICY "Contador ver docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = get_user_escritorio_id()::text
);

-- Contador INSERT: must match their escritorio_id in path
CREATE POLICY "Contador upload docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = get_user_escritorio_id()::text
);

-- Contador UPDATE: must match their escritorio_id in path
CREATE POLICY "Contador update docs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = get_user_escritorio_id()::text
) WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = get_user_escritorio_id()::text
);

-- Contador DELETE: must match their escritorio_id in path
CREATE POLICY "Contador deletar docs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = get_user_escritorio_id()::text
);

-- Cliente SELECT: must match their cliente_id in the second path segment
CREATE POLICY "Cliente ver docs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[2] = get_user_cliente_id()::text
);

-- Cliente INSERT: must match their cliente_id in the second path segment
CREATE POLICY "Cliente upload docs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[2] = get_user_cliente_id()::text
);
