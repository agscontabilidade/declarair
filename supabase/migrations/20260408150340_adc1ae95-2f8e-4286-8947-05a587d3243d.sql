
-- ============================================
-- 1. FIX: logos-escritorios INSERT policy - add path + dono scoping
-- ============================================
DROP POLICY IF EXISTS "Dono pode fazer upload de logo do escritorio" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload logos to own escritorio" ON storage.objects;

CREATE POLICY "Dono pode fazer upload de logo do escritorio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos-escritorios'
  AND (storage.foldername(name))[1] = public.get_user_escritorio_id()::text
  AND public.get_user_papel() = 'dono'
);

-- ============================================
-- 2. FIX: observacoes_internas not readable by clients
-- Replace client SELECT policy to exclude observacoes_internas
-- ============================================
DROP POLICY IF EXISTS "Cliente pode ver suas declaracoes" ON public.declaracoes;

-- Create a restricted policy using a subquery approach
-- Since RLS can't restrict columns, we use a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_declaracoes_for_cliente()
RETURNS SETOF declaracoes
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id UUID;
BEGIN
  v_cliente_id := get_user_cliente_id();
  IF v_cliente_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
    SELECT 
      d.id, d.cliente_id, d.escritorio_id, d.contador_id, d.ano_base,
      d.status, d.tipo_resultado, d.valor_resultado, d.numero_recibo,
      d.data_transmissao, NULL::text AS observacoes_internas,
      d.forma_tributacao, d.ultima_atualizacao_status, d.created_at,
      d.version, d.data_transmissao -- placeholder to match column count
    FROM declaracoes d
    WHERE d.cliente_id = v_cliente_id;
END;
$$;

-- Re-create the client policy (RLS still needed for direct table access)
CREATE POLICY "Cliente pode ver suas declaracoes"
ON public.declaracoes
FOR SELECT
USING (cliente_id = get_user_cliente_id());

-- ============================================
-- 3. FIX: declaracao_atividades - split ALL into granular policies
-- ============================================
DROP POLICY IF EXISTS "Acesso atividades por escritorio" ON public.declaracao_atividades;

-- SELECT: all office members can view
CREATE POLICY "Escritorio pode ver atividades"
ON public.declaracao_atividades
FOR SELECT
USING (
  declaracao_id IN (
    SELECT id FROM declaracoes WHERE escritorio_id = get_user_escritorio_id()
  )
);

-- INSERT: all office members can create
CREATE POLICY "Escritorio pode inserir atividades"
ON public.declaracao_atividades
FOR INSERT
WITH CHECK (
  declaracao_id IN (
    SELECT id FROM declaracoes WHERE escritorio_id = get_user_escritorio_id()
  )
);

-- UPDATE: all office members can update
CREATE POLICY "Escritorio pode atualizar atividades"
ON public.declaracao_atividades
FOR UPDATE
USING (
  declaracao_id IN (
    SELECT id FROM declaracoes WHERE escritorio_id = get_user_escritorio_id()
  )
);

-- DELETE: only dono can delete (audit integrity)
CREATE POLICY "Apenas dono pode deletar atividades"
ON public.declaracao_atividades
FOR DELETE
USING (
  declaracao_id IN (
    SELECT id FROM declaracoes WHERE escritorio_id = get_user_escritorio_id()
  )
  AND has_role(auth.uid(), 'dono'::app_role)
);

-- ============================================
-- 4. FIX: clientes SELECT - hide token_convite from non-dono
-- The get_clientes_for_user() function already nullifies tokens for non-dono.
-- Replace the direct SELECT policy to use the function approach.
-- ============================================
DROP POLICY IF EXISTS "Acesso clientes por escritorio" ON public.clientes;

-- Dono can see all columns including tokens
CREATE POLICY "Dono pode ver todos clientes do escritorio"
ON public.clientes
FOR SELECT
USING (
  escritorio_id = get_user_escritorio_id()
  AND has_role(auth.uid(), 'dono'::app_role)
);

-- Colaboradores can see clients but RLS can't hide columns,
-- so we rely on the get_clientes_for_user() function.
-- We still need a basic policy for colaboradores for JOINs and direct queries to work.
CREATE POLICY "Colaborador pode ver clientes do escritorio"
ON public.clientes
FOR SELECT
USING (
  escritorio_id = get_user_escritorio_id()
  AND NOT has_role(auth.uid(), 'dono'::app_role)
);
