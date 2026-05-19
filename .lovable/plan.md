## Objetivo
Eliminar os 10 findings reais do Grupo B do scanner sem regressão funcional. Trabalho dividido em 4 ondas, do menor risco para o maior. Cada onda é uma entrega independente — você aprova antes da próxima.

## Onda 1 — Frontend puro (sem migração, risco baixo)

**F1. `ia_fiscal_anon_key`**
- `src/components/declaracao/SecaoIAFiscal.tsx` (linha ~40) e `SecaoAnaliseCaixa.tsx` (linha ~253): trocar `VITE_SUPABASE_PUBLISHABLE_KEY` por `session.access_token` obtido via `supabase.auth.getSession()`.
- Mesmo padrão já em uso em `useBilling`, `useStripe`, `useWhatsApp`.
- Efeito imediato: IA Fiscal volta a funcionar (hoje está retornando 401 silenciosamente).

## Onda 2 — Edge functions (sem migração, risco baixo-médio)

**F2. `stripe_webhook_no_sig`**
- `supabase/functions/stripe-webhook/index.ts`: remover o `else` que faz `JSON.parse(body)` quando falta secret. Se `STRIPE_WEBHOOK_SECRET` ausente OU `signature` ausente → 400. Mantém `constructEventAsync` obrigatório.
- Secret já está configurado (`STRIPE_WEBHOOK_SECRET` listado em secrets), então sem impacto operacional.

**F3. `consulta_rfb_fake_auth`**
- `supabase/functions/consulta-rfb/index.ts`: substituir checagem de presença por `supabase.auth.getClaims(token)` conforme padrão Lovable. 401 se claims inválidos.

**F4. `accept_invite_no_auth`**
- `supabase/functions/accept-collaborator-invite/index.ts`:
  - Validar JWT com `getClaims`; exigir que `claims.sub === user_id` do body (ou simplesmente derivar `user_id` do JWT e ignorar o do body).
  - Derivar `escritorio_id`, `papel`, `email`, `nome` **exclusivamente** do registro `colaborador_convites` casado pelo token — nunca do body.
  - Manter o registro como `usado=true` ao final.

## Onda 3 — Migração de RLS (risco médio, reversível)

**F5. `convites_cliente_unauthenticated_access`**
- Migration: `ALTER POLICY ... TO authenticated` em todas as 4 policies (SELECT/INSERT/UPDATE/DELETE) de `convites_cliente`. Mantém condição `escritorio_id = get_user_escritorio_id()`. Nenhum fluxo legítimo é anônimo (auto-cadastro usa edge function com service role).

**F6. `usuario_permissoes_privilege_escalation`**
- Migration: dropar e recriar a policy "Accountants can manage permissions of their office" como `TO authenticated`, adicionando `WITH CHECK (user_id <> auth.uid())` para impedir self-grant. Dono continua podendo gerenciar via outra policy.

**F7. `auditoria_atividades_no_authenticated_read`**
- Migration: dropar policy atual e recriar usando `(SELECT auth.role()) = 'service_role'` no lugar de `auth.jwt() ->> 'role'`.

**F8. `audit_logs_no_insert_policy`**
- Verificar primeiro se algum caminho client-side escreve em `audit_logs`. Se sim (provável: trigger `process_audit_log` roda como SECURITY DEFINER, então OK), apenas documentar e marcar como fixed. Se algum INSERT vier de authenticated direto, adicionar policy `FOR INSERT WITH CHECK (user_id = auth.uid())`.

**F9. `public_assets_unrestricted_upload`**
- Migration: dropar policy "Authenticated Upload Access" do bucket `public-assets` e recriar restrita a `dono`/`admin` via `has_role`, com path forçado a começar com `{escritorio_id}/`. Avatares e logos têm buckets dedicados, então `public-assets` é só admin/branding global.

## Onda 4 — Realtime channel auth (risco mais alto, schema reservado)

**F10. `realtime_no_channel_authorization`**
- Adicionar RLS em `realtime.messages` com policies que cruzam `topic` (ex.: `escritorio:<uuid>`, `cliente:<uuid>`) com `get_user_escritorio_id()` / `get_user_cliente_id()`.
- **Pré-requisito:** auditar `useNotificacoes`, `useDeclaracao`, `useDashboardData`, `useChat`, `useDebouncedInvalidate` para padronizar nomes de canal (`postgres_changes` no schema `public` hoje filtra por tabela, não por topic — então o canal default é compartilhado e qualquer authenticated escuta tudo).
- **Risco:** se mudarmos a forma de subscrever sem ajustar todos os hooks, o app para de receber updates em tempo real. Por isso fica em onda separada.
- **Proposta:** primeiro inventariar os subscribes, depois propor migração + ajustes de cliente em uma única entrega.

## Ordem de entrega proposta
1. Onda 1 agora (1 arquivo, sem migração).
2. Onda 2 em seguida (3 edge functions, deploy automático).
3. Onda 3 após sua aprovação (1 migração consolidada com F5+F6+F7+F8+F9, reversível).
4. Onda 4 depois de eu mapear todos os subscribes e te mostrar o impacto.

## Confirma?
Posso começar pela Onda 1 já?
