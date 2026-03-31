
-- Clear child tables first (respecting FK order)
TRUNCATE public.mensagens_chat CASCADE;
TRUNCATE public.declaracao_atividades CASCADE;
TRUNCATE public.checklist_documentos CASCADE;
TRUNCATE public.formulario_ir CASCADE;
TRUNCATE public.malha_fina_consultas CASCADE;
TRUNCATE public.mensagens_enviadas CASCADE;
TRUNCATE public.cobrancas CASCADE;
TRUNCATE public.declaracoes_extras CASCADE;
TRUNCATE public.declaracoes CASCADE;
TRUNCATE public.convites_cliente CASCADE;
TRUNCATE public.colaborador_convites CASCADE;
TRUNCATE public.clientes CASCADE;
TRUNCATE public.templates_mensagem CASCADE;
TRUNCATE public.notificacoes CASCADE;
TRUNCATE public.pagamentos_assinatura CASCADE;
TRUNCATE public.assinaturas CASCADE;
TRUNCATE public.escritorio_addons CASCADE;
TRUNCATE public.whatsapp_instances CASCADE;
TRUNCATE public.integracoes_contaazul CASCADE;
TRUNCATE public.configuracoes_escritorio CASCADE;
TRUNCATE public.api_keys CASCADE;
TRUNCATE public.system_logs CASCADE;
TRUNCATE public.email_send_log CASCADE;
TRUNCATE public.suppressed_emails CASCADE;
TRUNCATE public.email_unsubscribe_tokens CASCADE;
TRUNCATE public.usuario_permissoes CASCADE;
TRUNCATE public.usuarios CASCADE;
TRUNCATE public.escritorios CASCADE;

-- Keep admin role, remove all others
DELETE FROM public.user_roles WHERE role != 'admin';
