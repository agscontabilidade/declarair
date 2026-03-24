
CREATE INDEX IF NOT EXISTS idx_declaracoes_cliente ON declaracoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_declaracoes_escritorio_status ON declaracoes(escritorio_id, status);
