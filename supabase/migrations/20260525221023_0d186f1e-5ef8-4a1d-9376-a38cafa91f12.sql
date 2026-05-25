
-- ============================================================
-- FASE 1: Revogar EXECUTE de funções SECURITY DEFINER internas
-- ============================================================

-- 1) Drop função duplicada/insegura (fallback para user_roles já fechado em outras)
DROP FUNCTION IF EXISTS public.get_user_papel_safe();

-- 2) Revogar EXECUTE de funções usadas APENAS por triggers ou processos admin
--    (service_role continua executando porque bypassa privilégios)

REVOKE EXECUTE ON FUNCTION public.set_declaracao_nota_updated_at()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.atualizar_cobrancas_vencidas()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limpar_token_convite(uuid)                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_declaracao_version()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb)               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_cliente_sensitive_fields()                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redirect_observacoes_internas()                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_declaracao_ultima_atualizacao()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrementar_declaracoes_utilizadas()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at()                                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_declaracao_limit()                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_audit_log()                                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notificar_nova_mensagem_cliente()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_system_configs_timestamp()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_atividade_status()                         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_transactional_email_notification()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.incrementar_declaracoes_utilizadas()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_usuario_role_change()                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.count_declaracoes_ativas(uuid)                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_can_create_declaracao(uuid)                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notificar_cobrancas_vencendo()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_revert_declaracao_status()                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_advance_declaracao_status()                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restrict_cliente_declaracao_update()                 FROM PUBLIC, anon, authenticated;

-- 3) Restringir funções acessíveis ao client autenticado:
--    primeiro revogamos de PUBLIC/anon, depois garantimos para authenticated
REVOKE EXECUTE ON FUNCTION public.get_user_cliente_id()                                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_cliente()                                         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_declaracoes_for_cliente()                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_log_auditoria(text, text, jsonb, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_escritorio_id()                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_mensagens_lidas(uuid, text)                   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_papel()                                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_clientes_for_user()                              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_tem_permissao(text)                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_cliente_escritorio_id()                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dashboard_kpis(uuid, integer)                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_cliente_invite_token(uuid)                       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_escritorio_safe_data(uuid)                       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_accountant_signup(uuid, text, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_user_cliente_id()                                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_cliente()                                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_declaracoes_for_cliente()                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_log_auditoria(text, text, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_escritorio_id()                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_mensagens_lidas(uuid, text)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_papel()                                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clientes_for_user()                               TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_tem_permissao(text)                              TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cliente_escritorio_id()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_kpis(uuid, integer)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cliente_invite_token(uuid)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_escritorio_safe_data(uuid)                        TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_accountant_signup(uuid, text, text, text)  TO authenticated;

-- 4) Funções públicas (anon) — APENAS fluxos de convite
--    Mantêm GRANT EXECUTE para anon (uso documentado e validado)
GRANT EXECUTE ON FUNCTION public.buscar_cliente_por_token(uuid)                        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_colaborador_invite_public(text)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.limpar_token_convite(uuid, uuid)                      TO anon, authenticated;
