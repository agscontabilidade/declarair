
-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_declaracoes_escritorio_status ON public.declaracoes(escritorio_id, status);
CREATE INDEX IF NOT EXISTS idx_declaracoes_escritorio_ano ON public.declaracoes(escritorio_id, ano_base);
CREATE INDEX IF NOT EXISTS idx_declaracoes_cliente ON public.declaracoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_escritorio ON public.clientes(escritorio_id);
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user ON public.clientes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_escritorio_status ON public.cobrancas(escritorio_id, status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento ON public.cobrancas(data_vencimento) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_declaracao ON public.mensagens_chat(declaracao_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notificacoes_escritorio_lida ON public.notificacoes(escritorio_id, lida) WHERE lida = false;
CREATE INDEX IF NOT EXISTS idx_checklist_declaracao ON public.checklist_documentos(declaracao_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_escritorio ON public.usuarios(escritorio_id);
