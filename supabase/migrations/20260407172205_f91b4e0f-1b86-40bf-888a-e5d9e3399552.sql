
-- =============================================
-- 1. FIX malha_fina_consultas: replace broad ALL policy
-- =============================================

DROP POLICY IF EXISTS "Acesso malha fina por escritorio" ON public.malha_fina_consultas;

-- SELECT: contador assigned to the client OR dono
CREATE POLICY "Malha fina select by role"
ON public.malha_fina_consultas
FOR SELECT
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND (
    public.has_role(auth.uid(), 'dono'::public.app_role)
    OR cliente_id IN (
      SELECT id FROM public.clientes
      WHERE escritorio_id = public.get_user_escritorio_id()
        AND (contador_responsavel_id = auth.uid() OR contador_responsavel_id IS NULL)
    )
  )
);

-- INSERT: only dono or assigned contador
CREATE POLICY "Malha fina insert by role"
ON public.malha_fina_consultas
FOR INSERT
TO authenticated
WITH CHECK (
  escritorio_id = public.get_user_escritorio_id()
  AND (
    public.has_role(auth.uid(), 'dono'::public.app_role)
    OR cliente_id IN (
      SELECT id FROM public.clientes
      WHERE escritorio_id = public.get_user_escritorio_id()
        AND contador_responsavel_id = auth.uid()
    )
  )
);

-- UPDATE: only dono or assigned contador
CREATE POLICY "Malha fina update by role"
ON public.malha_fina_consultas
FOR UPDATE
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND (
    public.has_role(auth.uid(), 'dono'::public.app_role)
    OR cliente_id IN (
      SELECT id FROM public.clientes
      WHERE escritorio_id = public.get_user_escritorio_id()
        AND contador_responsavel_id = auth.uid()
    )
  )
);

-- DELETE: only dono
CREATE POLICY "Malha fina delete by dono"
ON public.malha_fina_consultas
FOR DELETE
TO authenticated
USING (
  escritorio_id = public.get_user_escritorio_id()
  AND public.has_role(auth.uid(), 'dono'::public.app_role)
);

-- Service role full access
CREATE POLICY "Service role full access malha_fina"
ON public.malha_fina_consultas
FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- =============================================
-- 2. FIX escritorios: hide sensitive fields from non-owners
-- =============================================

-- Create a safe view that hides payment credentials from non-owners
CREATE OR REPLACE VIEW public.escritorios_safe
WITH (security_invoker = on)
AS
SELECT
  id, nome, logo_url, email, telefone, cnpj, plano,
  limite_declaracoes, created_at, cor_primaria, cor_fundo_portal,
  nome_portal, texto_boas_vindas, whitelabel_ativo, favicon_url,
  declaracoes_utilizadas, storage_limite_mb, usuarios_limite,
  plano_expira_em, onboarding_completo, razao_social, nome_fantasia,
  whatsapp, endereco_cep, endereco_logradouro, endereco_numero,
  endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf,
  -- Only show sensitive fields to dono
  CASE WHEN public.has_role(auth.uid(), 'dono'::public.app_role) THEN chave_pix ELSE NULL END AS chave_pix,
  CASE WHEN public.has_role(auth.uid(), 'dono'::public.app_role) THEN stripe_customer_id ELSE NULL END AS stripe_customer_id,
  CASE WHEN public.has_role(auth.uid(), 'dono'::public.app_role) THEN asaas_customer_id ELSE NULL END AS asaas_customer_id
FROM public.escritorios;
