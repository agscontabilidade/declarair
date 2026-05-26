
-- 1. clientes: revoke column-level select for sensitive token fields
REVOKE SELECT (token_convite, token_convite_expira_em) ON public.clientes FROM authenticated;
REVOKE SELECT (token_convite, token_convite_expira_em) ON public.clientes FROM anon;

-- 2. convites_cliente: revoke column-level select for raw token
REVOKE SELECT (token) ON public.convites_cliente FROM authenticated;
REVOKE SELECT (token) ON public.convites_cliente FROM anon;

-- 3. Storage listing tightening
DROP POLICY IF EXISTS "Avatars listing restricted to authenticated" ON storage.objects;
CREATE POLICY "Users can list own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

DROP POLICY IF EXISTS "Logos listing restricted to authenticated" ON storage.objects;
CREATE POLICY "Office members can list own logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = (public.get_user_escritorio_id())::text
);
