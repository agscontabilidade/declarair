
-- Add perfil_fiscal to formulario_ir for dynamic checklist
ALTER TABLE public.formulario_ir ADD COLUMN IF NOT EXISTS perfil_fiscal JSONB NOT NULL DEFAULT '{}';

-- Add forma_tributacao to declaracoes for tax calculation choice
ALTER TABLE public.declaracoes ADD COLUMN IF NOT EXISTS forma_tributacao TEXT;
