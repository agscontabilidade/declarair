-- 1. Harden self-update policy to explicitly prevent role/office/ativo changes
DROP POLICY IF EXISTS "Usuario pode atualizar proprio registro" ON public.usuarios;

CREATE POLICY "Usuario pode atualizar proprio registro"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND papel = (SELECT u.papel FROM public.usuarios u WHERE u.id = auth.uid())
  AND escritorio_id = (SELECT u.escritorio_id FROM public.usuarios u WHERE u.id = auth.uid())
  AND ativo = (SELECT u.ativo FROM public.usuarios u WHERE u.id = auth.uid())
);

-- 2. Replace escritorios SELECT policy for regular users with escritorios_safe columns only
-- Keep the existing policy name but restrict what non-dono users can see
-- We need to keep the direct table access for internal operations (auth context, etc.)
-- but the policy itself cannot restrict columns — so we'll add a function-based approach

-- Create a helper function that returns only safe escritorio data
CREATE OR REPLACE FUNCTION public.get_escritorio_safe_data(esc_id uuid)
RETURNS TABLE (
  id uuid, nome text, logo_url text, email text, telefone text, cnpj text,
  plano text, limite_declaracoes int, declaracoes_utilizadas int,
  plano_expira_em timestamptz, usuarios_limite int, storage_limite_mb int,
  onboarding_completo boolean, created_at timestamptz,
  nome_fantasia text, razao_social text,
  cor_primaria text, cor_fundo_portal text, nome_portal text, texto_boas_vindas text,
  favicon_url text, whitelabel_ativo boolean, whatsapp text,
  endereco_cep text, endereco_logradouro text, endereco_numero text,
  endereco_complemento text, endereco_bairro text, endereco_cidade text, endereco_uf text,
  chave_pix text, stripe_customer_id text, asaas_customer_id text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF has_role(auth.uid(), 'dono') OR has_role(auth.uid(), 'admin') THEN
    RETURN QUERY SELECT e.id, e.nome, e.logo_url, e.email, e.telefone, e.cnpj,
      e.plano, e.limite_declaracoes, e.declaracoes_utilizadas,
      e.plano_expira_em, e.usuarios_limite, e.storage_limite_mb,
      e.onboarding_completo, e.created_at,
      e.nome_fantasia, e.razao_social,
      e.cor_primaria, e.cor_fundo_portal, e.nome_portal, e.texto_boas_vindas,
      e.favicon_url, e.whitelabel_ativo, e.whatsapp,
      e.endereco_cep, e.endereco_logradouro, e.endereco_numero,
      e.endereco_complemento, e.endereco_bairro, e.endereco_cidade, e.endereco_uf,
      e.chave_pix, e.stripe_customer_id, e.asaas_customer_id
    FROM escritorios e WHERE e.id = esc_id;
  ELSE
    RETURN QUERY SELECT e.id, e.nome, e.logo_url, e.email, e.telefone, e.cnpj,
      e.plano, e.limite_declaracoes, e.declaracoes_utilizadas,
      e.plano_expira_em, e.usuarios_limite, e.storage_limite_mb,
      e.onboarding_completo, e.created_at,
      e.nome_fantasia, e.razao_social,
      e.cor_primaria, e.cor_fundo_portal, e.nome_portal, e.texto_boas_vindas,
      e.favicon_url, e.whitelabel_ativo, e.whatsapp,
      e.endereco_cep, e.endereco_logradouro, e.endereco_numero,
      e.endereco_complemento, e.endereco_bairro, e.endereco_cidade, e.endereco_uf,
      NULL::text, NULL::text, NULL::text
    FROM escritorios e WHERE e.id = esc_id;
  END IF;
END;
$$;