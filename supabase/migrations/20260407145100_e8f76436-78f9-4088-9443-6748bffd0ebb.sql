
-- 1. Fix: Remove overly permissive policy on colaborador_convites
DROP POLICY IF EXISTS "Link de convite publico" ON public.colaborador_convites;

-- 2. Fix: Restrict storage policies for logos-escritorios bucket
-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Create scoped policies using escritorio_id folder path
CREATE POLICY "Dono pode fazer upload de logo do escritorio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = (SELECT get_user_escritorio_id())::text
  AND get_user_papel() = 'dono'
);

CREATE POLICY "Dono pode atualizar logo do escritorio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = (SELECT get_user_escritorio_id())::text
  AND get_user_papel() = 'dono'
);

CREATE POLICY "Dono pode deletar logo do escritorio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = (SELECT get_user_escritorio_id())::text
  AND get_user_papel() = 'dono'
);

-- 3. Fix: Create a view to hide token_convite from collaborators
-- First create a security definer function to check if user is dono
CREATE OR REPLACE FUNCTION public.get_clientes_for_user()
RETURNS SETOF public.clientes
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Dono sees everything including tokens
  IF has_role(auth.uid(), 'dono') THEN
    RETURN QUERY SELECT * FROM public.clientes
      WHERE escritorio_id = get_user_escritorio_id();
  ELSE
    -- Colaboradores see rows but with tokens nullified
    RETURN QUERY SELECT 
      c.id, c.escritorio_id, c.contador_responsavel_id, c.nome, c.cpf,
      c.email, c.telefone, c.data_nascimento, c.status_onboarding,
      NULL::uuid AS token_convite,
      NULL::timestamptz AS token_convite_expira_em,
      c.created_at, c.auth_user_id, c.conta_azul_id
    FROM public.clientes c
    WHERE c.escritorio_id = get_user_escritorio_id();
  END IF;
END;
$$;
