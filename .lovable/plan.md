## Diagnóstico

Investiguei o banco e encontrei **7 declarações travadas** em `aguardando_documentos` mesmo já tendo documentos recebidos (status = `recebido` na tabela `checklist_documentos`):

| Cliente | Docs recebidos / Total |
|---|---|
| Bruno Eduardo Feitosa dos Santos Pronestino | 22 / 22 |
| Claudia Corrente Garcia | 8 / 8 |
| Daniela Rozados Coelho Silva | 3 / 3 |
| Ellise Annie Teixeira | 23 / 23 |
| Ivonete Fatima Felizardo Caetano | 5 / 5 |
| Marli Burgarelli Corrente | 4 / 4 |
| **Ricardo Minc** | **15 / 15** (o que você viu) |

### Causa raiz

A transição de status do Kanban (`aguardando_documentos` → `documentacao_recebida`) hoje é feita **na camada de frontend**, em locais separados:

- `src/pages/cliente/ClienteDocumentos.tsx` (upload do cliente) — atualiza `status` + `status_documentos`.
- `src/components/declaracoes/DocumentosDeclaracaoModal.tsx` (upload do contador) — **NÃO atualiza** `status` da declaração. Insere só na `checklist_documentos`.
- Outros pontos (Drive, anexar, processar-pdf) também inserem docs sem garantir a transição.

Resultado: quando o contador (ou um fluxo automatizado) anexa documentos pelo painel, o Kanban fica preso em "Aguardando Documentação". RLS silencioso ou exceção engolida em uploads antigos também pode ter deixado linhas órfãs.

## Correção (padrão da plataforma)

Mover a regra para o **banco de dados** via trigger, garantindo que qualquer caminho (cliente, contador, edge function, importação em massa, futuro) respeite a mesma regra. Isso elimina divergências entre frontends.

### 1. Trigger `AFTER INSERT/UPDATE` em `checklist_documentos`

Função `auto_advance_declaracao_status()`:

- Quando uma linha entra como `status = 'recebido'` e a `declaracoes.status` correspondente é `'aguardando_documentos'`:
  - Atualiza `declaracoes.status = 'documentacao_recebida'`
  - Atualiza `declaracoes.status_documentos = 'enviado'`
  - Atualiza `ultima_atualizacao_status = now()`
- Roda com `SECURITY DEFINER` para não depender da RLS do cliente que originou o upload.
- Não altera declarações já em `declaracao_pronta` ou `transmitida` (idempotente).

### 2. Trigger `AFTER DELETE` em `checklist_documentos`

Função `auto_revert_declaracao_status()`:

- Quando o último doc `recebido` é apagado e a declaração está em `documentacao_recebida`, volta para `aguardando_documentos` + `status_documentos = 'pendente'`.
- Mantém o comportamento que já existe no frontend (remover doc no portal do cliente), mas centralizado.
- Não reverte se já passou para `declaracao_pronta`/`transmitida`.

### 3. Backfill das 7 declarações travadas

Um `UPDATE` único corrigindo todas as declarações que têm pelo menos um doc `recebido` e ainda estão em `aguardando_documentos`. Move para `documentacao_recebida` + `status_documentos = 'enviado'` + atualiza `ultima_atualizacao_status`. Essa correção respeita a regra nova e desbloqueia os 7 clientes (Ricardo Minc, Bruno, Claudia, Daniela, Ellise, Ivonete, Marli).

### 4. Limpeza no frontend (opcional, baixo risco)

Manter os `UPDATE` atuais no `ClienteDocumentos.tsx` e adicionar o mesmo update no `DocumentosDeclaracaoModal.tsx` como cinto-de-segurança redundante (o trigger já garante, mas evita esperar refresh). **Não vou refatorar nada além disso** — escopo estrito.

## Arquivos afetados

- Nova migration SQL: cria as duas funções, os dois triggers e roda o backfill.
- `src/components/declaracoes/DocumentosDeclaracaoModal.tsx`: adiciona update redundante de status após insert bem-sucedido (1 bloco).

## Fora de escopo

- Não mexer em RLS, schema de outras tabelas, fluxo de cliente, formulário, design.
- Não tocar em `declaracao_pronta` / `transmitida` (essas seguem manuais).
- Não refatorar os outros pontos de upload (Drive, edge function) — o trigger já cobre.

Aprovação para implementar?