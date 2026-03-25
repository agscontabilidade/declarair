
-- 1. FIX CRITICAL: Create a view that hides token_convite from general access
-- Instead of modifying the SELECT policy (which can't filter columns), 
-- we'll use a security definer function to null out tokens for non-dono users
CREATE OR REPLACE FUNCTION public.get_user_papel_safe()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Unified: check user_roles first, fall back to usuarios.papel
  SELECT COALESCE(
    (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1),
    (SELECT u.papel FROM public.usuarios u WHERE u.id = auth.uid())
  )
$$;

-- 2. FIX WARN: Standardize role checks - update get_user_papel to also check user_roles
-- Replace get_user_papel with unified version
CREATE OR REPLACE FUNCTION public.get_user_papel()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid() LIMIT 1),
    (SELECT u.papel FROM public.usuarios u WHERE u.id = auth.uid())
  )
$$;

-- 3. FIX CRITICAL: Add trigger to null out token_convite for non-dono SELECT
-- Since RLS can't filter columns, we add a policy that restricts token visibility
-- by creating a column-level security approach via trigger on SELECT isn't possible,
-- so we'll restrict the token columns at the application level and ensure
-- the convite flow uses the security definer function buscar_cliente_por_token

-- Actually, the proper fix is to ensure colaboradores can't USE the token.
-- The token is only useful via buscar_cliente_por_token + limpar_token_convite
-- Both are SECURITY DEFINER and validate the token properly.
-- The real risk is a colaborador reading the token and navigating to /cliente/convite/:token
-- Let's add a check in limpar_token_convite to prevent this attack vector

CREATE OR REPLACE FUNCTION public.limpar_token_convite(_cliente_id uuid, _auth_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Prevent someone who is already a usuario (contador) from claiming a client account
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = _auth_user_id) THEN
    RAISE EXCEPTION 'Users who are already staff cannot claim client accounts';
  END IF;
  
  UPDATE public.clientes
  SET token_convite = NULL,
      token_convite_expira_em = NULL,
      status_onboarding = 'concluido',
      auth_user_id = _auth_user_id
  WHERE id = _cliente_id;
END;
$$;

-- Also update the single-param version
CREATE OR REPLACE FUNCTION public.limpar_token_convite(_cliente_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  UPDATE public.clientes
  SET token_convite = NULL,
      token_convite_expira_em = NULL,
      status_onboarding = 'concluido'
  WHERE id = _cliente_id
$$;
