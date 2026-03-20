

# Dashboard e Lista de Clientes — Plano de Implementação

## Visao Geral

Duas telas completas com dados reais do Lovable Cloud: Dashboard com KPIs + Kanban drag-and-drop, e Lista de Clientes com CRUD.

---

## Migração SQL Necessária

Habilitar Realtime na tabela `declaracoes` e `cobrancas`:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.declaracoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cobrancas;
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useDashboardData.ts` | Hook com queries React Query para KPIs e declarações do kanban, filtrado por ano_base e escritorio_id. Realtime subscription para invalidar queries. |
| `src/hooks/useClientes.ts` | Hook com query paginada de clientes (busca ilike nome/cpf), insert de novo cliente, contagem total. |
| `src/hooks/useCobrancasAtrasadas.ts` | Hook que retorna count de cobrancas com status='atrasado'. Realtime subscription na tabela cobrancas. |
| `src/components/dashboard/KpiCards.tsx` | 4 cards: Total Clientes, Em Andamento, Doc Pendente, Transmitidas. Skeleton loader. |
| `src/components/dashboard/KanbanBoard.tsx` | 4 colunas com cards de declaração. Drag-and-drop via HTML5 drag API (sem lib externa). Optimistic update no status. |
| `src/components/dashboard/KanbanCard.tsx` | Card individual: avatar iniciais, nome, CPF mascarado, badge contador, alerta 7 dias, count docs pendentes. |
| `src/components/dashboard/KanbanColumn.tsx` | Coluna com header colorido, drop zone, empty state. |
| `src/components/clientes/ClienteModal.tsx` | Dialog com form: nome*, cpf* (máscara+validação 11 dígitos), email, telefone (máscara), data_nascimento, contador_responsavel (select de usuarios do escritório). |
| `src/components/clientes/ClientesTable.tsx` | Tabela com colunas formatadas, badges de status, ações (ver, whatsapp, cobranças). |

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Reescrever com header (título, select ano, avatar dropdown), KpiCards, KanbanBoard. Usar useDashboardData. |
| `src/pages/Clientes.tsx` | Reescrever com busca debounce, ClientesTable, paginação, ClienteModal. Usar useClientes. |
| `src/components/layout/Sidebar.tsx` | Adicionar item "Declarações" (/declaracoes), badge vermelho em Cobranças com count de atrasadas via useCobrancasAtrasadas. Avatar com iniciais no footer. Estilo ativo: bg-accent (fundo #3B82F6). |
| `src/components/layout/DashboardLayout.tsx` | Adicionar header com título dinâmico, select de ano fiscal (state via context ou prop), notificações, avatar dropdown com sair. |

---

## Detalhes Técnicos

**Dashboard queries** (todas filtradas por `escritorio_id` do AuthContext):
- KPI 1: `supabase.from('clientes').select('id', { count: 'exact', head: true })`
- KPIs 2-4: `supabase.from('declaracoes').select('id', { count: 'exact', head: true }).eq('ano_base', ano).eq('status', X)`
- Kanban: `supabase.from('declaracoes').select('*, clientes(nome, cpf), usuarios!declaracoes_contador_id_fkey(nome), checklist_documentos(id, status)').eq('ano_base', ano)` - grouped by status in JS

**Drag and drop**: HTML5 native `draggable`, `onDragStart`/`onDragOver`/`onDrop`. On drop: optimistic move card to new column, then `supabase.from('declaracoes').update({ status, ultima_atualizacao_status: new Date().toISOString() })`. On error: revert + toast.

**Realtime**: `supabase.channel('declaracoes-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'declaracoes' }, () => queryClient.invalidateQueries(['declaracoes']))`. Same pattern for cobrancas badge.

**Clientes busca**: `useQuery` com debounced search term (300ms via setTimeout). Query: `.ilike('nome', '%search%')` or `.ilike('cpf', '%search%')` using `.or()`. Pagination via `.range(from, to)` with page state.

**CPF mascarado no kanban**: Show first 3 digits + `.***.***-` + last 2 digits (e.g., `123.***.***-00`).

**Sidebar badge**: Real-time count query on `cobrancas` where `status = 'atrasado'`. Rendered as small red circle with number.

**Ano fiscal select**: State managed in Dashboard page, passed as prop/context. Default: current year.

**Paginação clientes**: 10 por página, usando `.range()` do Supabase + count exact.

