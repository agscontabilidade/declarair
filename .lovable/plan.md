# Campo "Detalhes" do Cliente para o Contador

## Objetivo
Permitir que o cliente escreva uma observação livre ao enviar documentos, e que essa observação chegue de forma visível e destacada no painel do contador.

## Onde guardar (forma mais otimizada e segura)

Adicionar **uma única coluna** na tabela `declaracoes`:
- `observacoes_cliente TEXT NULL` — texto livre escrito pelo cliente.
- `observacoes_cliente_atualizado_em TIMESTAMPTZ NULL` — para mostrar "atualizado há X" e badge de "novo" quando o contador ainda não viu.
- `observacoes_cliente_lida_em TIMESTAMPTZ NULL` — marca quando o contador abriu a declaração e leu (controla o destaque "não lida").

Por que na `declaracoes` e não em tabela nova:
- 1 observação por declaração (não é histórico/chat — já existe `mensagens_chat` para isso).
- Zero JOINs nas listas (clientes/declarações) — apenas mais 3 colunas no SELECT.
- RLS já existente cobre tudo: cliente já pode `UPDATE` sua própria declaração (policy "Cliente pode atualizar sua declaracao"), e contador já lê via `escritorio_id`.
- Não precisa nova policy, nova tabela, nem novo bucket.

## Segurança
- O `UPDATE` do cliente continua restrito pela policy existente (`cliente_id = get_user_cliente_id()`).
- O frontend cliente envia **apenas** os 2 campos (`observacoes_cliente`, `observacoes_cliente_atualizado_em`) — nunca status/valores/etc.
- Validação Zod no client: máx. 2000 caracteres, trim, sem HTML.
- Marca `lida_em` apenas o contador (RLS de escritório já protege).

## Mudanças no Frontend

### 1. `src/pages/cliente/ClienteDocumentos.tsx`
- Novo card "Detalhes para o seu contador" abaixo da área de upload, com destaque visual: borda e fundo `amber/warning` (tom de aviso amigável), ícone `MessageSquareText`, título destacado e microcopy explicando a importância ("Conte ao seu contador qualquer detalhe relevante: rendimentos extras, dúvidas, mudanças no ano…").
- `<Textarea>` controlado, debounce 1.5s (mesmo padrão de `SecaoNotas.tsx`), indicador "Salvo automaticamente" + contador de caracteres (0/2000).
- Ao salvar: `UPDATE declaracoes SET observacoes_cliente = ?, observacoes_cliente_atualizado_em = now(), observacoes_cliente_lida_em = NULL` (zera leitura para destacar de novo no contador).
- Invalida queries: `cliente-declaracao-ativa`, `dashboard-declaracoes`, `declaracoes`, `declaracao`.
- Insere `notificacoes` para o contador apenas se passou de >2min desde a última atualização (anti-spam).

### 2. `src/hooks/useClientePortal.ts`
- Incluir `observacoes_cliente`, `observacoes_cliente_atualizado_em` no `select` da declaração ativa para hidratar o textarea inicial.

### 3. Indicador na lista de clientes — `src/components/clientes/ClientesTable.tsx`
- Mostrar um badge âmbar pequeno "💬 Detalhes" ao lado do nome quando a declaração ativa do cliente tiver `observacoes_cliente` não-vazia **e** `observacoes_cliente_lida_em` for null (não lida).
- Buscar via JOIN/select aninhado já existente em `useClientes` (acrescentar campos no select).

### 4. Indicador na lista de declarações — `src/components/dashboard/KanbanCard.tsx` + `src/components/dashboard/DeclaracoesListView.tsx`
- Mesmo badge âmbar "Detalhes do cliente" no card/linha quando houver observação não-lida.
- Acrescentar campos no select de `useDashboardData.ts`.

### 5. Painel da declaração — `src/pages/DeclaracaoDetalhe.tsx`
- Novo componente `SecaoObservacoesCliente` exibido **no topo** da página (antes das tabs) quando `observacoes_cliente` existir.
- Card destacado em âmbar com ícone, texto da observação, timestamp ("enviado pelo cliente em DD/MM/AAAA às HH:mm") e botão "Marcar como lida" (atualiza `observacoes_cliente_lida_em = now()`).
- Auto-marca como lida ao montar o componente se ainda estiver `null`, após 3s de visualização.
- Invalida `dashboard-declaracoes` e `clientes` para sumir o badge nas listas.

## Mudanças no Banco

Migração:
```sql
ALTER TABLE public.declaracoes
  ADD COLUMN observacoes_cliente TEXT,
  ADD COLUMN observacoes_cliente_atualizado_em TIMESTAMPTZ,
  ADD COLUMN observacoes_cliente_lida_em TIMESTAMPTZ;

CREATE INDEX idx_declaracoes_obs_cliente_nao_lida
  ON public.declaracoes (escritorio_id)
  WHERE observacoes_cliente IS NOT NULL AND observacoes_cliente_lida_em IS NULL;
```
(Sem novas RLS — as existentes já cobrem.)

## Fora de escopo
- Histórico de observações (use chat já existente para conversa contínua).
- Notificação por e-mail/WhatsApp (só notificação in-app já existente).
- Edição/exclusão pelo contador.

## Resultado para o usuário
- Cliente vê um card âmbar destacado em /cliente/documentos onde escreve detalhes e salva automaticamente.
- Contador vê badge "Detalhes" na lista de clientes e nos cards do kanban/lista de declarações enquanto não ler.
- Ao abrir a declaração, vê a observação em destaque no topo e ela é marcada como lida automaticamente.
