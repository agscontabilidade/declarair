# Paginação em Cobranças e Mensagens Enviadas

## Objetivo
Reduzir a quantidade de dados trafegados e renderizados nas duas telas que hoje carregam tudo de uma vez, sem quebrar nada existente. Foco: **Cobranças** (`/cobrancas`) e **Mensagens Enviadas** (aba em Configurações).

Escopo estrito: paginação + seletor "itens por página". Nada de refatorar lógica de negócio, KPIs, filtros existentes ou layout.

---

## 1. Componente reutilizável: `PaginationControls`

Novo arquivo `src/components/ui/pagination-controls.tsx`.

- Mostra: "Mostrando X–Y de Z" + botões Anterior/Próximo + seletor de tamanho (10, 25, 50, 100).
- Props: `page`, `totalPages`, `pageSize`, `total`, `onPageChange`, `onPageSizeChange`.
- Usa componentes shadcn já existentes (`Button`, `Select`).
- Padrão: 25/página.

---

## 2. Cobranças (`/cobrancas`)

### Hook `useCobrancas` (`src/hooks/useCobrancas.ts`)

Mudanças:
- Aceitar novos parâmetros: `page` (default 0), `pageSize` (default 25), `busca` (string).
- Query principal passa a usar `range(from, from + pageSize - 1)` + `count: 'exact'`.
- Mover a busca (nome cliente, CPF, descrição) e filtro `cliente_id` (vindo do query param `?cliente=`) **para o servidor** via `.or()` / `.eq()`, em vez de filtrar no `useMemo` da página. Isso é necessário porque paginar client-side em cima de filtro client-side seria inconsistente.
- `placeholderData: keepPreviousData` para evitar flicker ao trocar página.
- Retornar `total` e `totalPages`.

### KPIs — não quebrar

Os KPIs (Total a Receber, Recebido no Ano, Atrasado) hoje são calculados em cima do array completo. Com paginação isso fica incorreto. Solução: **query separada dedicada a KPIs**, agregando server-side.

- Nova query `['cobrancas-kpis', escritorioId]` em `useCobrancas`.
- Faz **3 requisições paralelas leves** com `select('valor', { head: false })` filtrando por status:
  - `status in (pendente, atrasado)` → soma → `totalReceber`
  - `status = pago` AND `data_pagamento >= 01/01/ano-atual` → soma → `recebidoAno`
  - `status = atrasado` → soma → `atrasado`
- Como não há agregação SQL exposta pelo client supabase-js sem RPC, somar em JS após `select('valor')`. Isso ainda é leve (uma coluna numérica, sem joins) e fica em cache `staleTime: 60s`.
- KPIs **não** dependem de `statusFilter` / `busca` / `page` — eles sempre refletem o escritório inteiro (comportamento mais útil para o contador).

### Página `src/pages/Cobrancas.tsx`

- Adicionar estados `page` e `pageSize`.
- Passar `page`, `pageSize`, `busca`, `clienteIdFiltro` ao hook.
- Remover o `useMemo` de filtragem client-side (agora server-side).
- Resetar `page` para 0 quando `statusFilter`, `busca` ou `clienteIdFiltro` mudarem.
- Debounce de 400ms na busca antes de disparar query (mesmo padrão de `useClientes`).
- Adicionar `<PaginationControls />` abaixo de `<CobrancasTable />`.

---

## 3. Mensagens Enviadas

Local hoje: `useMensagens` retorna `mensagens` carregando tudo. Renderizado provavelmente em `src/components/configuracoes/MensagensTab.tsx` (a verificar no momento da implementação).

### Hook `useMensagens` (`src/hooks/useMensagens.ts`)

- Separar em duas exports OU adicionar params opcionais:
  - Manter `templates` (lista pequena, não precisa paginar).
  - `mensagens` passa a aceitar `page` / `pageSize` e retornar `{ data, total, totalPages }`.
- `range()` + `count: 'exact'` + `keepPreviousData`.
- Default 25/página, ordenação atual mantida (`enviado_em desc`).

### Componente que consome (`MensagensTab` ou equivalente)

- Estados locais `page` / `pageSize`.
- Renderizar `<PaginationControls />` no rodapé da lista.
- Nenhuma mudança visual no resto.

---

## 4. O que NÃO muda

- Kanban, Dashboard, Clientes (já paginado), Drive, Admin: fora do escopo desta entrega.
- RLS, schema do banco, mutations (criar/editar/excluir/marcar pago), modais.
- KPIs continuam globais por escritório (comportamento mais correto e o que o contador espera).
- Realtime (não há nessas listas).

---

## 5. Detalhes técnicos

```text
useCobrancas(params)
  params: { statusFilter, busca, clienteId, page, pageSize, periodoInicio, periodoFim }
  retorna: {
    cobrancas, total, totalPages, isLoading, isError, error, refetch,
    kpis: { totalReceber, recebidoAno, atrasado },  // query separada
    marcarPago, cancelar, excluir, criar, editar
  }

Query principal:
  supabase.from('cobrancas')
    .select('*, clientes(nome, cpf)', { count: 'exact' })
    .eq('escritorio_id', escritorioId)
    [.eq('status', statusFilter) se !== 'todos']
    [.eq('cliente_id', clienteId) se houver]
    [.or('clientes.nome.ilike.%X%,descricao.ilike.%X%') + filtro CPF se busca]
    .order('data_vencimento', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

Atenção: filtro por CPF em tabela relacionada via .or() exige sintaxe
referenced-table; se ficar complexo, manter busca por CPF client-side
apenas na página atual (degradação aceitável).
```

```text
PaginationControls
  ┌──────────────────────────────────────────────────────────────┐
  │  Mostrando 1–25 de 312    [25 ▾]   ‹ Anterior   Próxima ›   │
  └──────────────────────────────────────────────────────────────┘
```

---

## 6. Verificação após implementar

- `/cobrancas`: trocar página, mudar tamanho, aplicar filtro de status, buscar — sem flicker e sem dados errados.
- KPIs permanecem corretos comparando com o total de cobranças do escritório.
- Aba Mensagens em Configurações: lista pagina corretamente, ordenação preservada.
- Build TypeScript limpa.

## 7. Fora do escopo (próximas iterações, se quiser)
- Paginar Drive, Admin (Logs, Webhooks, Bug Reports, Emails).
- Índices SQL em `cobrancas(escritorio_id, status, data_vencimento)` e `mensagens_enviadas(escritorio_id, enviado_em desc)` — recomendado para escritórios com muitos registros, mas exige migration e está fora desta entrega.
