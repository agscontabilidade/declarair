
## Ajuste

Excluir declarações com `status === 'transmitida'` do cálculo de urgência (paradas +7d / atenção 3-7d), pois após transmissão não há mais mudança de status esperada.

## Mudança

**`src/hooks/useDashboardFilters.ts`** — em `calcularUrgencia`, adicionar parâmetro opcional `status` e retornar `'normal'` quando `status === 'transmitida'`. Atualizar as 2 chamadas (filtro de urgência e cálculo de stats) para passar `dec.status`.

```ts
export function calcularUrgencia(dataAtualizacao: string, status?: string): 'urgente' | 'atencao' | 'normal' {
  if (status === 'transmitida') return 'normal';
  if (!dataAtualizacao) return 'normal';
  // ... resto igual
}
```

## Efeito

- Chip 🔴 "Paradas +7d" e 🟡 "Atenção 3-7d" não contam mais transmitidas.
- Filtro de urgência também ignora transmitidas.
- KanbanCard já restringe o ⚠ a `documentacao_recebida` e `declaracao_pronta`, então não é afetado.

## Não muda

Schema, RLS, chips visuais, KpiCards, KanbanCard, edge functions.
