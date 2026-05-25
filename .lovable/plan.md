## Adicionar filtros de ordenação no Dashboard (/dashboard)

### Contexto
O dashboard atual já possui filtros de busca, contador, urgência e status. O usuário quer adicionar ordenação por:
1. **Ordem de cadastro** (mais recente → mais antigo, e vice-versa)
2. **Ordem alfabética** (A → Z, e Z → A)

### Arquivos a modificar

1. **`src/hooks/useDashboardData.ts`**
   - Adicionar `created_at` ao tipo `DeclaracaoKanban` e ao mapeamento da query (o campo `created_at` já existe na tabela `declaracoes`).

2. **`src/hooks/useDashboardFilters.ts`**
   - Adicionar `created_at: string` à interface `DeclaracaoFiltravel`.
   - Adicionar campo `ordenacao` ao estado `DashboardFilters` com os valores possíveis:
     - `cadastro_recente` — mais recente primeiro
     - `cadastro_antigo` — mais antigo primeiro
     - `alfabetica_az` — nome do cliente A → Z
     - `alfabetica_za` — nome do cliente Z → A
   - Implementar a lógica de ordenação no `declaracoesFiltradas` (após todos os filtros, antes do retorno).
   - Exportar setter `setOrdenacao`.
   - Incluir `ordenacao` no cálculo de `hasActiveFilters`.
   - Incluir `ordenacao: 'cadastro_recente'` como default no `clearFilters`.

3. **`src/components/dashboard/DashboardFilters.tsx`**
   - Adicionar props `ordenacao` e `onOrdenacaoChange`.
   - Inserir um `<Select>` de ordenação na Row 2 (ao lado dos selects existentes de contador e status).
   - Adicionar chip de filtro ativo para ordenação, com botão de remoção.
   - Ícone: `ArrowUpDown` do lucide-react.

4. **`src/pages/Dashboard.tsx`**
   - Desestruturar `setOrdenacao` e `ordenacao` do hook `useDashboardFilters`.
   - Passar ambos para o componente `<DashboardFilters>`.

### Sem alterações no backend
Toda a ordenação será feita no frontend (client-side), dentro do hook `useMemo`. Nenhuma mudança no Supabase é necessária.