-- 1) Helper SECURITY DEFINER para retornar o escritorio_id do cliente logado
CREATE OR REPLACE FUNCTION public.get_user_cliente_escritorio_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT escritorio_id FROM public.clientes WHERE auth_user_id = auth.uid()
$$;

-- 2) Revoga leitura direta dos tokens de convite (continua acessível via service role / RPC)
REVOKE SELECT (token_convite, token_convite_expira_em)
  ON public.clientes FROM authenticated;
REVOKE SELECT (token_convite, token_convite_expira_em)
  ON public.clientes FROM anon;

-- 3) Storage: substitui a política "Cliente ver docs v2" para checar escritorio_id também
DROP POLICY IF EXISTS "Cliente ver docs v2" ON storage.objects;

CREATE POLICY "Cliente ver docs v2"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (public.get_user_cliente_escritorio_id())::text
  AND (storage.foldername(name))[2] = (public.get_user_cliente_id())::text
);

DROP POLICY IF EXISTS "Cliente upload docs v2" ON storage.objects;

CREATE POLICY "Cliente upload docs v2"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (public.get_user_cliente_escritorio_id())::text
  AND (storage.foldername(name))[2] = (public.get_user_cliente_id())::text
);

DROP POLICY IF EXISTS "Cliente deletar docs v2" ON storage.objects;

CREATE POLICY "Cliente deletar docs v2"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[1] = (public.get_user_cliente_escritorio_id())::text
  AND (storage.foldername(name))[2] = (public.get_user_cliente_id())::text
);