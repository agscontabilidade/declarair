# Corrigir busca em /cobrancas

## Problema
O campo de busca em `/cobrancas` anuncia "Buscar por cliente, CPF ou descrição", mas o hook `useCobrancas` só filtra server-side por `descricao` (`.ilike('descricao', ...)`). Como `nome`/`cpf` ficam na tabela relacionada `clientes`, o filtro client-side que existe hoje (`Cobrancas.tsx` linhas 55-69) roda em cima de uma página já vazia. Resultado: buscas por nome ou CPF nunca encontram nada, mesmo quando o cliente existe.

## Escopo
Apenas o hook `src/hooks/useCobrancas.ts` e remoção do filtro client-side redundante em `src/pages/Cobrancas.tsx`. Sem mudanças de UI, schema, RLS ou edge functions.

## Mudança

### `src/hooks/useCobrancas.ts`
Quando `buscaTrim` está preenchido:

1. Detectar se o termo parece CPF (≥3 dígitos após `replace(/\D/g,'')`).
2. Fazer uma pré-consulta em `clientes` (mesmo `escritorio_id`) para obter `id` dos clientes cujo `nome ilike %termo%` OU (se houver dígitos) `cpf ilike %digitos%`. Limitar a, por exemplo, 500 ids para segurança.
3. Na query principal de `cobrancas`, usar `.or()` combinando:
   - `descricao.ilike.%termo%`
   - `cliente_id.in.(id1,id2,...)` — somente quando a pré-consulta retornou ids.
4. Se a pré-consulta retornar 0 ids e o termo não bater por descrição, o `.or` cai só em `descricao.ilike`, mantendo comportamento atual para esse caso.
5. Manter `count: 'exact'` e paginação intactos — agora `total` reflete o resultado real da busca, então a paginação funciona corretamente.

### `src/pages/Cobrancas.tsx`
Remover o `useMemo` de filtro client-side (linhas 55-69) e passar `cobrancasPage` direto para `<CobrancasTable />`. Não é mais necessário, pois o servidor já devolve o conjunto correto e completo (paginado).

## Por que não usar `clientes!inner` + filtro em foreign table
PostgREST suporta filtros em tabela embutida, mas combinar com `.or()` cruzando tabela base + embutida é frágil e não conta corretamente com `count: 'exact'` em alguns cenários. A pré-consulta em `clientes` é simples, previsível e mantém o `count` correto para a paginação.

## Validação
- Buscar por parte do nome do cliente → retorna cobranças desse cliente.
- Buscar por CPF (com ou sem máscara) → retorna cobranças.
- Buscar por parte da descrição → continua funcionando.
- Termo vazio → comportamento original.
- Combinação com filtro de status / período / cliente fixado pela URL continua funcionando (filtros aplicados em sequência na mesma query).
