# Avisos de cobrança (email/WhatsApp) em /cobrancas

Replicar o padrão já usado para lembretes de prazo IR, agora aplicado a cobranças **pendentes** ou **atrasadas**, com envio individual e disparo em massa via fila.

## 1. UX em /cobrancas

**Botão por linha** (CobrancasTable, só para status `pendente`/`atrasado`):
- Novo ícone "Avisar" (sino) ao lado dos ícones existentes → abre `AvisoCobrancaModal` travado naquela cobrança.

**Botão global no topo** da página /cobrancas:
- "Avisar em massa" → abre o mesmo modal pré-carregado com todas as cobranças `pendente`+`atrasado` da view atual (respeita filtros aplicados).

**Modal `AvisoCobrancaModal`**:
- Seletor de canal: Email / WhatsApp (WhatsApp desabilitado se addon inativo, igual ao LembreteEnvioModal).
- Lista compacta de cobranças-alvo (nome, valor, vencimento, status) — com checkbox para deselecionar individualmente no modo massa.
- Campo "Mensagem personalizada" (textarea) com placeholders disponíveis: `{nome}`, `{valor}`, `{vencimento}`, `{descricao}`, `{dias_atraso}`, `{escritorio}`, `{chave_pix}`.
- Pré-visualização ao vivo do primeiro alvo.
- Contador "X de Y serão enviados" + aviso de quantos serão pulados por falta de email/telefone.
- Botão "Enviar" desabilitado durante envio, com loader.

## 2. Templates personalizáveis (Configurações)

Em `Configurações → Mensagens` (já tem aba), adicionar nova sub-aba **"Aviso de Cobrança"** com dois templates editáveis:
- `cobranca_aviso_whatsapp_template`
- `cobranca_aviso_email_assunto` + `cobranca_aviso_email_corpo`

Padrões sensatos pré-preenchidos. Mesmos placeholders do modal. Salvos em `escritorios` (3 colunas novas, nullable).

## 3. Edge function `enviar-aviso-cobranca`

Espelha `enviar-lembretes-prazo`:
- Auth: valida JWT, confirma que é usuário ativo do escritório.
- Input Zod: `{ canal: 'email'|'whatsapp', cobrancaIds: uuid[] (1..500), mensagem?: string }`.
- Carrega cobranças + cliente (filtra apenas as do `escritorio_id` do usuário e status `pendente`/`atrasado` — defesa em profundidade).
- Verifica addon WhatsApp ativo quando canal=whatsapp; limite 300 por chamada.
- **Email**: para cada alvo, renderiza assunto/corpo a partir do template do escritório + mensagem custom, e enfileira em `transactional_emails` via `enqueue_email` RPC (dispatcher `process-email-queue` já cuida de rate-limit, retries, DLQ, TTL).
- **WhatsApp**: invoca `whatsapp-service` action `send-message` com delay de 400ms entre envios (mesmo padrão atual).
- Registra cada envio em `mensagens_enviadas` (cliente_id, canal, conteudo_final, status `enfileirado`/`enviado`/`falhou`).
- Retorna `{ enfileirados, enviados, pulados: [{cobrancaId, motivo}] }`.

Sem rate limiting custom; reutiliza a fila pgmq que já tem batch_size/send_delay configuráveis.

## 4. Template de email transacional

Novo template React-Email em `supabase/functions/_shared/transactional-email-templates/aviso-cobranca.tsx` + registro em `registry.ts`. Inclui valor, vencimento, dias de atraso, descrição, chave PIX do escritório (se houver) e link unsubscribe (padrão do projeto).

## 5. Migração

```sql
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS cobranca_aviso_whatsapp_template text,
  ADD COLUMN IF NOT EXISTS cobranca_aviso_email_assunto text,
  ADD COLUMN IF NOT EXISTS cobranca_aviso_email_corpo text;
```

Sem mudança em RLS — `escritorios` já tem políticas de update para dono.

## 6. Segurança e estabilidade

- Todas as queries no edge function filtram por `escritorio_id` do JWT, mesmo recebendo IDs do cliente (não confia no input).
- Status válido enforced server-side (só `pendente`/`atrasado`).
- Email passa pela fila pgmq → retries, backoff, DLQ, suppression list automáticos.
- WhatsApp com delay 400ms + teto de 300/chamada para não estourar Evolution API.
- Sem alteração em schema sensível, sem novas tabelas.

## Arquivos

**Novos**
- `src/components/cobrancas/AvisoCobrancaModal.tsx`
- `src/hooks/useAvisoCobrancaTemplates.ts`
- `src/components/configuracoes/AvisoCobrancaTemplateTab.tsx`
- `supabase/functions/enviar-aviso-cobranca/index.ts`
- `supabase/functions/_shared/transactional-email-templates/aviso-cobranca.tsx`
- Migração SQL (3 colunas em `escritorios`)

**Editados**
- `src/components/cobrancas/CobrancasTable.tsx` (ícone "Avisar" por linha)
- `src/pages/Cobrancas.tsx` (botão "Avisar em massa")
- `src/components/configuracoes/MensagensTab.tsx` (nova sub-aba)
- `supabase/functions/_shared/transactional-email-templates/registry.ts`
- `supabase/config.toml` (verify_jwt=true para a nova função)
