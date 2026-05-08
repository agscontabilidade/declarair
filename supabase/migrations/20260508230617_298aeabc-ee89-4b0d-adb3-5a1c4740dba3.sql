CREATE INDEX IF NOT EXISTS idx_declaracoes_escritorio_ano ON public.declaracoes (escritorio_id, ano_base);
CREATE INDEX IF NOT EXISTS idx_declaracao_notas_internas_id ON public.declaracao_notas_internas (declaracao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_escritorio_id ON public.clientes (escritorio_id);