
# Lembretes de prazo IRPF — disparo em massa para clientes pendentes

## Objetivo
Tela onde o contador vê todos os clientes com declaração do ano corrente em status `aguardando_documentos` e dispara um aviso (email ou WhatsApp) lembrando do prazo final. Suporta envio individual ou em massa, com prazo digitado no momento.

## Escopo (estrito)
Adiciona apenas: 1 página nova, 1 modal, 1 edge function nova, 1 template de email novo, 1 entrada no registry, 1 link na sidebar. Não toca em fluxos existentes (Clientes, Declarações, WhatsApp config, fila de emails).

---

## 1. UI — `/lembretes`

Nova rota e item na sidebar ("Lembretes IR", ícone `BellRing`).

**Tela** (`src/pages/Lembretes.tsx`):
- Header: título + contador "X clientes aguardando documentos".
- Card de filtros: busca por nome, toggle "incluir já lembrados nos últimos 7 dias".
- Tabela com checkbox por linha:
  - Nome do cliente
  - Email | Telefone (badge ✓/✗ indicando se canal disponível)
  - Status da declaração
  - Última atividade (`ultima_atualizacao_status`)
  - Coluna "Último lembrete" (data + canal) — vem de `email_send_log` + nova tabela `lembretes_enviados`
  - Ação inline: 📧 enviar email | 💬 enviar WhatsApp
- Barra fixa no rodapé quando há seleção: "Enviar lembrete para N selecionados" → abre modal.

**Modal de envio em massa** (`LembreteEnvioModal.tsx`):
- Canal: radio **Email** | **WhatsApp** (WhatsApp mostra cadeado + CTA "Ativar addon" se não tiver — não bloqueia render).
- Campo "Prazo final" (date picker) — obrigatório.
- Textarea com mensagem padrão pré-preenchida e variáveis `{nome}`, `{prazo}`, `{escritorio}` (preview ao vivo do primeiro selecionado).
- Resumo: "X emails serão enfileirados / Y clientes sem email serão pulados".
- Botão "Enviar" → chama edge function `enviar-lembretes-prazo`.

---

## 2. Backend

### 2.1 Tabela `lembretes_enviados` (rastreio anti-spam)
```
id, escritorio_id, cliente_id, declaracao_id, canal('email'|'whatsapp'),
prazo_final date, enviado_por uuid, enviado_em, status('enfileirado'|'falhou')
```
RLS: SELECT/INSERT por `escritorio_id = get_user_escritorio_id()`; service_role full.

### 2.2 Template de email `lembrete-prazo-ir.tsx`
Reaproveita `EmailLayout` (mesmo layout dos atuais). Variáveis: `nomeCliente`, `nomeEscritorio`, `prazoFinal`, `anoBase`, `linkPortal`, `mensagemPersonalizada`. Registrado em `registry.ts`.

### 2.3 Edge function `enviar-lembretes-prazo` (nova)
- `verify_jwt = true`, valida JWT do contador, lê `escritorio_id` do `usuarios`.
- Body Zod: `{ canal, prazoFinal, mensagem, clienteIds: string[] }`.
- Para cada cliente:
  - Confere via service_role que o cliente pertence ao escritório e tem declaração `aguardando_documentos` no ano corrente.
  - **Email**: chama `enqueue_email('transactional_emails', {...})` diretamente (mesmo padrão do `send-transactional-email` e da fila pgmq existente) — **não** envia inline, **não** chama `send-transactional-email` em loop. Isso reaproveita o dispatcher `process-email-queue` que já roda a cada 5s com batch + delay configuráveis. Zero risco de estourar provedor.
  - **WhatsApp**: confere se o escritório tem o addon `whatsapp` ativo em `escritorio_addons`. Se sim, chama `whatsapp-service?action=send-text` por cliente, com `await new Promise(r=>setTimeout(r,400))` entre cada (rate-limit Evolution). Se não, pula com erro `addon_inativo`.
  - Insere linha em `lembretes_enviados`.
- Retorna `{ enfileirados, pulados: [{clienteId, motivo}] }`.

### 2.4 Hook `useLembretesPendentes.ts`
React Query: lista clientes do escritório com `declaracoes.status = 'aguardando_documentos' AND ano_base = ano_corrente`, juntando última entrada em `lembretes_enviados`.

---

## 3. Carga no backend — análise

Resposta direta: **não vai quebrar nada.**

- **Email**: enfileirar 500 emails é só `pgmq.send` 500 vezes (~1s). O dispatcher já existente drena em lotes de 10 a cada 5s com 200ms entre sends = **~120 emails/min**, com retry, DLQ e respeito a `Retry-After`. Para 500 clientes, leva ~4 min. Para 2000, ~17 min. Sem pico de carga.
- **WhatsApp**: Evolution API tolera bem ~2 msg/s. Loop com `await sleep(400ms)` no edge function dá margem. Para 200 clientes: ~80s. **Limite prático sugerido**: 300 destinatários por disparo WhatsApp (validação no edge function); acima disso retorna erro pedindo dividir. Email não tem esse limite.
- Nenhuma alteração nos triggers, nas rotas de upload, no Kanban, no Stripe ou nas RLS existentes.

---

## Detalhes técnicos

- Rota registrada em `src/App.tsx` sob `ProtectedRoute` (apenas papel `dono`/`colaborador`).
- Permissão: nova entrada `lembretes.enviar` no `usePermissoes` (dono sempre; colaborador herda se já tiver `clientes.editar`).
- WhatsApp upsell reaproveita `AddonRequiredModal` existente.
- `supabase/config.toml`: adicionar bloco para `enviar-lembretes-prazo` com `verify_jwt = true`.
- Telemetria: cada disparo registra em `auditoria_atividades` via `registrar_log_auditoria`.

## Arquivos
**Novos**
- `src/pages/Lembretes.tsx`
- `src/components/lembretes/LembretesTable.tsx`
- `src/components/lembretes/LembreteEnvioModal.tsx`
- `src/hooks/useLembretesPendentes.ts`
- `supabase/functions/enviar-lembretes-prazo/index.ts`
- `supabase/functions/_shared/transactional-email-templates/lembrete-prazo-ir.tsx`
- Migration: tabela `lembretes_enviados` + RLS + GRANTs.

**Editados (mínimo)**
- `src/App.tsx` (rota), `src/components/layout/Sidebar.tsx` (link), `registry.ts` (template), `supabase/config.toml` (função).

## Fora de escopo
- Agendamento automático/cron (pode ser fase 2).
- Edição de templates pelo contador (usa texto livre no modal já cobre por ora).
- Lembretes para clientes em outros status.
