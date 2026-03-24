
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS onboarding_completo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS chave_pix text,
  ADD COLUMN IF NOT EXISTS endereco_cep text,
  ADD COLUMN IF NOT EXISTS endereco_logradouro text,
  ADD COLUMN IF NOT EXISTS endereco_numero text,
  ADD COLUMN IF NOT EXISTS endereco_complemento text,
  ADD COLUMN IF NOT EXISTS endereco_bairro text,
  ADD COLUMN IF NOT EXISTS endereco_cidade text,
  ADD COLUMN IF NOT EXISTS endereco_uf text;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS avatar_url text;
