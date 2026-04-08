-- Drop and recreate the view to fix column ordering
DROP VIEW IF EXISTS public.escritorios_safe;

CREATE VIEW public.escritorios_safe
WITH (security_invoker = on)
AS
SELECT
  id, nome, logo_url, email, telefone, cnpj,
  plano, limite_declaracoes, declaracoes_utilizadas,
  plano_expira_em,
  usuarios_limite, storage_limite_mb,
  onboarding_completo, created_at,
  nome_fantasia, razao_social,
  cor_primaria, cor_fundo_portal, nome_portal, texto_boas_vindas,
  favicon_url, whitelabel_ativo, whatsapp,
  endereco_cep, endereco_logradouro, endereco_numero,
  endereco_complemento, endereco_bairro, endereco_cidade, endereco_uf,
  CASE WHEN get_user_papel() = 'dono' THEN chave_pix ELSE NULL END AS chave_pix,
  CASE WHEN get_user_papel() = 'dono' THEN stripe_customer_id ELSE NULL END AS stripe_customer_id,
  CASE WHEN get_user_papel() = 'dono' THEN asaas_customer_id ELSE NULL END AS asaas_customer_id
FROM public.escritorios;