## Status atual

Boa notícia: **os scanners de segurança (supabase, supabase_lov, agent_security) estão zerados**. As 3 vulnerabilidades reais identificadas na última varredura já foram fechadas (tokens de convite, escalada de privilégio via `user_roles`, vazamento de chat entre colaboradores).

O que sobrou são **53 warnings do linter do Supabase** — não são vulnerabilidades exploradas hoje, são endurecimentos de superfície de ataque. Categorias:

| Categoria | Qtd | O que é |
|---|---|---|
| Public Bucket Allows Listing | 3 | Buckets públicos (`avatars`, `logos-escritorios`, `public-assets`) permitem listar todos os arquivos via storage.list |
| Public Can Execute SECURITY DEFINER Function | 10 | Funções chamáveis por usuários **não logados** (anon) |
| Signed-In Users Can Execute SECURITY DEFINER Function | 40 | Funções chamáveis por qualquer usuário logado, mesmo internas/triggers |

## Sobre o erro do GitHub

Eu não tenho ferramenta que leia o log do sync com o GitHub. Para investigar preciso que você me passe:
- A mensagem de erro exata (texto ou screenshot)
- Quando começou a acontecer (depois de qual mudança/commit)
- Se é no push (Lovable → GitHub) ou no pull (GitHub → Lovable)

Suspeitas comuns: PR aberto bloqueando merge na branch padrão, conflito de merge, token do GitHub App expirado, ou um arquivo grande/binário sendo rejeitado. Posso checar arquivos suspeitos no repo, mas o log é o caminho mais rápido.

## Plano de hardening (3 fases, em produção)

### Fase 1 — Revogar EXECUTE de funções internas (zero risco)

Funções `SECURITY DEFINER` usadas **apenas por triggers** ou chamadas só com `service_role` em edge functions não devem ficar expostas no PostgREST. Vou `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated` em cada uma. Service role continua executando normalmente.

Funções que **continuam** chamáveis pelo client (mantém GRANT):

| Função | Quem pode chamar | Por quê |
|---|---|---|
| `dashboard_kpis` | authenticated | KPIs do dashboard do contador |
| `buscar_cliente_por_token` | anon | Tela de aceite de convite do cliente |
| `get_colaborador_invite_public` | anon | Tela de aceite de convite do colaborador |
| `handle_new_accountant_signup` | authenticated | Wizard de cadastro do escritório |
| `marcar_mensagens_lidas` | authenticated | Chat |
| `get_cliente_invite_token` | authenticated (já restrito a dono) | Reuso de convite pendente |
| `limpar_token_convite(_cliente_id, _auth_user_id)` | anon | Conclusão do aceite de convite (verificar uso real antes) |
| `get_declaracoes_for_cliente` | authenticated | Listagem do portal do cliente |
| `get_clientes_for_user` | authenticated | Listagem de clientes (mascara tokens) |
| `get_escritorio_safe_data` | authenticated | Dados do escritório |
| `has_role`, `user_tem_permissao`, `is_cliente`, `get_user_*` | authenticated | Helpers usados dentro de RLS de outras tabelas (precisam ficar) |
| `registrar_log_auditoria` | authenticated | Logging client-side |

Tudo o resto (triggers + helpers de fila pgmq + `redirect_observacoes_internas`, `protect_*`, `enforce_declaracao_limit`, `notificar_*`, `auto_*`, `incrementar_*`, `process_audit_log`, `trigger_transactional_email_notification`, `dashboard_kpis` internas, `update_*`, `handle_updated_at`, `set_*`, `touch_*`, `move_to_dlq`, `enqueue_email`, `read_email_batch`, `delete_email`, `count_declaracoes_ativas`, `check_can_create_declaracao`, `atualizar_cobrancas_vencidas`, `notificar_cobrancas_vencendo`) será revogado.

Também vou **remover a função duplicada `get_user_papel_safe`** que ainda faz fallback para `user_roles` — exatamente o vetor que fechamos na última rodada.

### Fase 2 — Bloquear listing dos buckets públicos (baixo risco)

Manter buckets como **públicos para download por URL** (logos, avatars, marca whitelabel continuam carregando nas páginas), mas **bloquear a operação LIST** restringindo a policy de SELECT em `storage.objects` para esses três buckets a apenas requisições com path conhecido (autenticadas) ou movendo o `SELECT` para `service_role`/`authenticated` com filtro por nome. Resultado: ninguém anônimo consegue mais enumerar `https://…/storage/v1/object/list/avatars` para descobrir nomes de arquivos de outros escritórios, mas as `<img src>` continuam funcionando.

### Fase 3 — Configurações de Auth recomendadas

- Ativar **Leaked Password Protection** (HIBP) na configuração de Auth do Cloud — bloqueia cadastro com senha vazada.
- Confirmar que `disable_signup` está como você quer (hoje signup do contador é via wizard próprio, então signup público pode ficar desligado).
- Sem alterar provider Google se já está em uso.

Essa fase é por configuração de Auth (não migration), aplico após sua confirmação.

## O que NÃO vou mexer (para não quebrar)

- Schema das tabelas — sem `ALTER TABLE`.
- RLS policies que já estão funcionando — só revogação de EXECUTE de funções.
- Edge functions e código do client — não preciso tocar, porque `service_role` continua passando.
- Buckets `documentos-clientes` e `bug-screenshots` — já são privados.

## Validação após cada fase

1. Rodar `supabase--linter` para confirmar redução de warnings.
2. Validar pelo browser: dashboard carrega, lista de clientes carrega, chat funciona, signup de novo contador funciona, aceite de convite do cliente funciona, logos do escritório aparecem.
3. Rodar varredura de segurança novamente.

## Detalhes técnicos

- Operação principal: `REVOKE EXECUTE ON FUNCTION public.<nome>(<assinatura>) FROM PUBLIC, anon, authenticated;` por função, em uma única migration.
- Para storage: `DROP POLICY` + `CREATE POLICY` em `storage.objects` por bucket, mantendo `bucket_id = 'X' AND (storage.foldername(name))[1] IS NOT NULL` no SELECT só para authenticated.
- Cada fase é uma migration separada, então qualquer rollback é cirúrgico.

---

**Posso começar pela Fase 1?** E sobre o GitHub, me manda a mensagem de erro que aparece pra mim seguir a investigação em paralelo.