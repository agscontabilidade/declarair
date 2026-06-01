
-- ===== colaborador_convites: re-fix correto (revoke de tabela + grant por coluna) =====
REVOKE ALL ON TABLE public.colaborador_convites FROM anon;
REVOKE SELECT ON TABLE public.colaborador_convites FROM authenticated;
GRANT SELECT (id, escritorio_id, email, nome, papel, enviado_por, usado, expira_em, usado_em, created_at, permissoes)
  ON public.colaborador_convites TO authenticated;
-- Mantém INSERT/UPDATE/DELETE para authenticated (RLS já restringe por dono/escritorio).
GRANT INSERT, UPDATE, DELETE ON public.colaborador_convites TO authenticated;

-- ===== convites_cliente: revoke do token =====
REVOKE ALL ON TABLE public.convites_cliente FROM anon;
REVOKE SELECT ON TABLE public.convites_cliente FROM authenticated;
GRANT SELECT (id, escritorio_id, nome_sugerido, cpf_sugerido, email_sugerido,
              mensagem_personalizada, usado, usado_em, usado_por_cliente_id,
              expira_em, created_at, created_by)
  ON public.convites_cliente TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.convites_cliente TO authenticated;

-- ===== webhooks: revoke do secret =====
REVOKE ALL ON TABLE public.webhooks FROM anon;
REVOKE SELECT ON TABLE public.webhooks FROM authenticated;
GRANT SELECT (id, escritorio_id, url, eventos, ativo, created_at, updated_at)
  ON public.webhooks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;

-- ===== integracoes_contaazul: revoke das credenciais OAuth =====
REVOKE ALL ON TABLE public.integracoes_contaazul FROM anon;
REVOKE SELECT ON TABLE public.integracoes_contaazul FROM authenticated;
GRANT SELECT (id, escritorio_id, client_id, token_expira_em, ativo,
              ultima_sincronizacao, created_at)
  ON public.integracoes_contaazul TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.integracoes_contaazul TO authenticated;

-- service_role mantém acesso total (jobs/edge functions).
GRANT ALL ON public.colaborador_convites TO service_role;
GRANT ALL ON public.convites_cliente TO service_role;
GRANT ALL ON public.webhooks TO service_role;
GRANT ALL ON public.integracoes_contaazul TO service_role;
