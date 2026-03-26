ALTER TABLE public.malha_fina_consultas 
ADD COLUMN IF NOT EXISTS resultado_json JSONB,
ADD COLUMN IF NOT EXISTS situacao_cadastral TEXT,
ADD COLUMN IF NOT EXISTS data_consulta TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_malha_fina_resultado ON public.malha_fina_consultas USING gin(resultado_json);
CREATE INDEX IF NOT EXISTS idx_malha_fina_situacao ON public.malha_fina_consultas(situacao_cadastral);