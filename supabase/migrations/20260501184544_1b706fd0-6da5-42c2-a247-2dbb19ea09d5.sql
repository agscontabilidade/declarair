-- Re-create storage policies for 'documentos-clientes' with the correct folder structure
-- The app uses: {escritorio_id}/{cliente_id}/{subfolder}/{filename}

-- Drop old possibly incorrect policies
DROP POLICY IF EXISTS "Contador ver docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador update docs" ON storage.objects;
DROP POLICY IF EXISTS "Contador deletar docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente ver docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente upload docs" ON storage.objects;
DROP POLICY IF EXISTS "Cliente deletar docs" ON storage.objects;

-- Helper functions are already present in the schema (get_user_escritorio_id, get_user_cliente_id)

-- CONTADOR POLICIES (Accesses by escritorio_id in first folder)
CREATE POLICY "Contador ver docs v2" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'documentos-clientes' 
    AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

CREATE POLICY "Contador upload docs v2" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'documentos-clientes' 
    AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

CREATE POLICY "Contador update docs v2" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'documentos-clientes' 
    AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

CREATE POLICY "Contador deletar docs v2" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'documentos-clientes' 
    AND (storage.foldername(name))[1] = (get_user_escritorio_id())::text
);

-- CLIENTE POLICIES (Accesses by cliente_id in second folder)
CREATE POLICY "Cliente ver docs v2" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'documentos-clientes' 
    AND (storage.foldername(name))[2] = (get_user_cliente_id())::text
);

CREATE POLICY "Cliente upload docs v2" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'documentos-clientes' 
    AND (storage.foldername(name))[2] = (get_user_cliente_id())::text
);

CREATE POLICY "Cliente deletar docs v2" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'documentos-clientes' 
    AND (storage.foldername(name))[2] = (get_user_cliente_id())::text
);
