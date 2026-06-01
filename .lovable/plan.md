
## Objetivo

Quando o contador alterar o status de processamento RFB para **"Processada sem erros"** na página `/declaracoes`, abrir um modal para anexar o PDF de comprovação da Receita. O documento é salvo no Drive do cliente e enviado por email (com anexo + link de download) no padrão visual dos demais emails do sistema.

## Fluxo do usuário

1. Contador clica em "Processada" no `ProcessamentoSwitch`.
2. Em vez de atualizar direto, abre `ComprovacaoProcessamentoModal`.
3. Modal mostra: cliente, ano-base, área de upload (drag&drop) de **um PDF** (máx. 10MB), checkbox "Enviar email ao cliente com o anexo" (default ✓) e textarea com mensagem padrão editável.
4. Ao confirmar:
   - Upload do PDF para `documentos-clientes` em `{escritorio_id}/{cliente_id}/{checklist_id}/{filename}`.
   - Cria linha em `checklist_documentos` (categoria `contador`, status `recebido`) → aparece automaticamente no Drive do cliente e na aba Documentos da declaração.
   - Atualiza `declaracoes`: `status_processamento_rfb='processada'`, `em_processamento=true`, novos campos `comprovacao_processamento_url`, `comprovacao_processamento_nome`, `comprovacao_processamento_enviada_em`.
   - Se checkbox marcado → invoca `send-transactional-email` com novo template `processamento-receita-confirmado` e attachmentPath do PDF.
5. Toast de sucesso; o switch reflete "Processada".
6. Se o usuário cancelar o modal, o status NÃO muda (continua como estava).
7. Se o status já é "processada" e existe `comprovacao_processamento_url`, voltar a clicar em "Processada" no menu não reabre — agente um botão "Reenviar/Substituir comprovação" no dropdown.

## Arquivos

**Novos**
- `src/components/declaracoes/ComprovacaoProcessamentoModal.tsx` — modal com upload, validação (PDF, ≤10MB), preview do nome, textarea de mensagem, checkbox de envio de email, mutações em sequência com rollback em caso de erro.
- `supabase/functions/_shared/transactional-email-templates/processamento-receita-confirmado.tsx` — template React Email no mesmo padrão visual do `envio-manual-declaracao` (header, mensagem do contador, botão "Baixar comprovação", assinatura).

**Editados**
- `src/components/declaracoes/ProcessamentoSwitch.tsx` — quando a opção clicada for `processada`, em vez de mutar direto, dispara `onRequestProcessada()` para abrir o modal. Demais status continuam mutando direto.
- `src/pages/Declaracoes.tsx` — controla o estado do modal (qual declaração está sendo processada) e renderiza `ComprovacaoProcessamentoModal` global.
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — registra `processamento-receita-confirmado`.
- `supabase/functions/send-transactional-email/index.ts` — apenas se necessário whitelistar o novo template (geralmente já é via registry).

## Banco de dados (migration)

Adicionar à tabela `declaracoes`:
- `comprovacao_processamento_url TEXT` (path no storage)
- `comprovacao_processamento_nome TEXT`
- `comprovacao_processamento_uploaded_at TIMESTAMPTZ`
- `comprovacao_processamento_enviada_em TIMESTAMPTZ` (quando email foi enfileirado)

Sem alteração de RLS (a tabela `declaracoes` já tem políticas adequadas).

## Template de email (padrão atual)

- Mesmo layout React Email do `envio-manual-declaracao` (header colorido com logo do escritório, saudação, mensagem, callout, botão CTA "Baixar comprovação", rodapé).
- Mensagem padrão: "Olá {nome}, sua declaração IRPF {ano} foi **processada sem erros pela Receita Federal**. Em anexo o documento que comprova o processamento."
- Anexo: PDF da comprovação (via `attachmentPaths`, signed URL gerado pelo edge function como já feito).
- Botão CTA: link assinado de 7 dias para download direto.

## Segurança e robustez

- Validação client-side: `application/pdf` apenas, ≤10MB.
- Ordem de operações com rollback: (1) insert `checklist_documentos` → (2) upload storage → se falhar, deleta a linha → (3) update `arquivo_url` → (4) update `declaracoes` → (5) invoke email (fila, com `idempotencyKey = comprov-{declaracaoId}`).
- Email vai pela fila existente (`send-transactional-email`) — retry automático.
- Idempotência: se houver `comprovacao_processamento_url` e o usuário reenviar, substitui o arquivo (mesmo `checklist_documentos.id`) em vez de duplicar.
- Toast distinto para sucesso de upload vs. enfileiramento de email.
- Status só muda para `processada` após o upload concluir com sucesso.

## Fora de escopo

- Não altera Kanban/Dashboard, não toca RLS, não cria nova edge function, não altera billing.
