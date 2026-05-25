## Objetivo
Exibir o indicador "Detalhes enviados pelo cliente" também na página `/declaracoes` (lista principal), além dos lugares já existentes (Kanban, Dashboard Lista, ClientesTable, DeclaracaoDetalhe).

## Mudanças

### 1. `src/pages/Declaracoes.tsx`
- Incluir no `select` da query `declaracoes-lista`: `observacoes_cliente, observacoes_cliente_atualizado_em, observacoes_cliente_lida_em`.
- Adicionar os campos na interface `DeclaracaoListaItem`.
- **Desktop (tabela)**: ao lado do nome do cliente (na mesma linha do nome, antes do CPF), renderizar um ícone `MessageSquareText` âmbar com Tooltip quando `observacoes_cliente` existir.
  - Se `observacoes_cliente_lida_em == null` → badge âmbar sólido pulsante "Não lida" (mesmo padrão do `DeclaracoesListView`).
  - Se já lida → ícone âmbar discreto (sem pulse), apenas sinalizando que existe observação.
  - Tooltip mostra o conteúdo (truncado em ~200 chars) e instrução "Abra a declaração para ler".
  - `onClick` com `stopPropagation` para não interferir, mas o clique na linha continua navegando para `/declaracoes/:id`.
- **Mobile (cards)**: mesmo indicador ao lado do nome do cliente no header do card.

### 2. Sem alterações de banco / RLS
Os campos já existem e já são lidos em outros lugares; apenas estendemos a query desta página.

### 3. Sem alterações em outros componentes
`KanbanCard`, `DeclaracoesListView` (dashboard), `ClientesTable` e `SecaoObservacoesCliente` permanecem como estão.

## Detalhes técnicos
- Reaproveitar paleta âmbar já usada (`bg-amber-500 text-white` para não lida, `text-amber-600` para lida).
- Importar `MessageSquareText` de `lucide-react`.
- Manter `staleTime: 30000` da query; a marcação como lida feita em `DeclaracaoDetalhe` já invalida `dashboard-declaracoes` — adicionar invalidação de `declaracoes-lista` no `SecaoObservacoesCliente` para refletir imediatamente nesta página também.

## Fora de escopo
- Notificações novas, alterações de schema, modal próprio na lista (a leitura continua em `/declaracoes/:id`).
