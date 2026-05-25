## Ajuste

Em `src/components/dashboard/KanbanBoard.tsx` (linhas 14–17), trocar as cores de fundo dos cabeçalhos das colunas:

| Coluna | Antes | Depois |
|---|---|---|
| Aguardando Documentação | `bg-warning/10` (laranja) | **mantém** |
| Documentação Recebida | `bg-accent/10` (verde) | `bg-sky-100 dark:bg-sky-950/40` (azul claro — mesmo tom do badge `info` do sistema) |
| Declaração Pronta | `bg-success/10` (verde) | `bg-muted` (cinza — igual ao que era de "Transmitidas") |
| Transmitidas | `bg-muted` (cinza) | `bg-success/10` (verde) |

Sem mudança em nenhum outro arquivo, lógica, dnd, ou estilos de cards.
