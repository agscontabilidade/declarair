ALTER TABLE public.formulario_ir 
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS raca_cor TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS uf TEXT,
ADD COLUMN IF NOT EXISTS natureza_ocupacao TEXT,
ADD COLUMN IF NOT EXISTS ocupacao_principal TEXT;

COMMENT ON COLUMN public.formulario_ir.natureza_ocupacao IS 'Código ou descrição da natureza da ocupação conforme Receita Federal';
COMMENT ON COLUMN public.formulario_ir.ocupacao_principal IS 'Código ou descrição da ocupação principal conforme Receita Federal';