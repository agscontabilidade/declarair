
-- =============================================
-- 1. FIX BUG-SCREENSHOTS: Remove broad public SELECT
-- =============================================
DROP POLICY IF EXISTS "Screenshots publicos para leitura" ON storage.objects;

-- Also remove overly permissive INSERT (allows any authenticated user to upload anywhere in bucket)
DROP POLICY IF EXISTS "Usuarios podem fazer upload de screenshots" ON storage.objects;

-- =============================================
-- 2. FIX LOGOS-ESCRITORIOS: Remove duplicate/overly permissive write policies
-- =============================================
-- Keep "Dono pode *" policies (they have path + role checks)
-- Remove generic ones that lack dono role check
DROP POLICY IF EXISTS "Users can upload logos to own escritorio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update logos in own escritorio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logos in own escritorio" ON storage.objects;

-- Remove one of the duplicate SELECT policies (keep "Logos are publicly accessible")
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;

-- =============================================
-- 3. FIX DOCUMENTOS-CLIENTES: Add client DELETE policy
-- =============================================
CREATE POLICY "Cliente deletar docs" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'documentos-clientes'
  AND (storage.foldername(name))[2] = (get_user_cliente_id())::text
);

-- =============================================
-- 4. FIX get_user_papel: Use usuarios.papel as PRIMARY source
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_papel()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT u.papel FROM public.usuarios u WHERE u.id = auth.uid()),
    (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_papel_safe()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT u.papel FROM public.usuarios u WHERE u.id = auth.uid()),
    (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1)
  )
$$;
