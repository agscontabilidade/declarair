CREATE INDEX IF NOT EXISTS idx_declaracoes_esc_ano_status
  ON public.declaracoes (escritorio_id, ano_base, status);

CREATE INDEX IF NOT EXISTS idx_mensagens_enviadas_esc_data
  ON public.mensagens_enviadas (escritorio_id, enviado_em DESC);

CREATE INDEX IF NOT EXISTS idx_notificacoes_esc_created
  ON public.notificacoes (escritorio_id, created_at DESC);