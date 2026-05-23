## Objetivo
Adicionar campo de busca dinâmica por nome do cliente em `/cobrancas`, no mesmo padrão visual já usado em `/drive` (input com ícone de lupa, filtragem em tempo real conforme o usuário digita).

## Contexto
- `/drive` já possui esse comportamento: `Input` com ícone `Search`, estado local `busca`, filtro via `useMemo` por `nome` e `cpf`.
- `/cobrancas` hoje só tem filtro por status (`Select`) e por `cliente` via query-param. Falta o campo de busca livre.

## Mudanças

**`src/pages/Cobrancas.tsx`**
1. Adicionar estado `const [busca, setBusca] = useState('')`.
2. Estender o `useMemo` que já gera `cobrancas` para também filtrar por `busca` quando preenchida, comparando (case-insensitive) contra:
   - `c.clientes?.nome`
   - `c.clientes?.cpf` (apenas dígitos, igual ao Drive)
   - `c.descricao` (útil para localizar cobrança por título)
3. Adicionar, na barra de filtros (linha ~161, junto ao `Select` de status), um `Input` com:
   - Ícone `Search` da `lucide-react` posicionado absoluto à esquerda.
   - Placeholder: `"Buscar por cliente, CPF ou descrição..."`.
   - Largura responsiva (`flex-1` ou `max-w-sm`) para ficar ao lado do select.
4. Importar `Input` de `@/components/ui/input` e `Search` de `lucide-react`.

Sem mudanças em hooks, banco, RLS ou em `/drive` (que já tem a busca funcionando).

## Resultado
Ao digitar o nome do cliente em `/cobrancas`, a tabela é filtrada imediatamente, com o mesmo padrão UX da página `/drive`.