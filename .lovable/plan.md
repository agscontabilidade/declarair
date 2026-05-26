## Problema

Ao arrastar um card no Kanban do `/dashboard`, aparecem listras verticais coloridas atravessando toda a coluna (vide screenshot). Não é deformação de layout — é **smearing de texto**: o navegador não está recompondo corretamente os pixels conforme o card arrastado e os cards abaixo dele se animam ao mesmo tempo.

## Causas

1. **Sem promoção de camada GPU no overlay** — `DragOverlay` renderiza um `KanbanCard` com `rotate-2 scale-105`, mas sem `will-change: transform` nem `translateZ(0)`. O texto antialiased rasterizado fica sendo "arrastado" sem ser limpo a cada frame.
2. **Cards de baixo reagem ao hover durante o drag** — conforme o overlay passa por cima, cada card abaixo dispara `group-hover:text-accent`, `hover:-translate-y-0.5`, `hover:shadow-lg`, `hover:border-accent/30`. Isso somado ao smearing produz as faixas coloridas.
3. **Cor do nome troca via `transition-colors`** dentro de `group-hover` enquanto o frame ainda está sendo composto.

## Mudanças (somente apresentação, escopo estrito)

### `src/components/dashboard/KanbanCard.tsx`

- Adicionar à `style` do card:
  - `willChange: 'transform'`
  - `backfaceVisibility: 'hidden' as const`
  - `WebkitFontSmoothing: 'antialiased'`
- Quando `isOverlay` for true, garantir `transform: translateZ(0)` para forçar layer própria.
- Receber um novo prop opcional `isAnyDragging?: boolean` e, quando true, **desativar todos os estados de hover** do card de fundo: remover `hover:shadow-lg`, `hover:border-accent/30`, `hover:-translate-y-0.5` e o `group-hover:text-accent` no nome. Isso é puramente visual: o card continua sendo um droppable normal.
- Manter `transition` igual quando não está arrastando.

### `src/components/dashboard/KanbanColumn.tsx`

- Aceitar prop `isAnyDragging?: boolean` e repassar para cada `<KanbanCard>`.

### `src/components/dashboard/KanbanBoard.tsx`

- Passar `isAnyDragging={!!activeItem}` para cada `<KanbanColumn>`.
- Sem alterações em lógica, queries, automação ou regras de transmissão.

## Fora do escopo

- `kanbanAutomations.ts`, `useDashboardData`, `DeclaracoesListView`, regras de versionamento/transmissão, filtros, KPIs, paginação.

## Verificação

Após implementar: arrastar um card de "Aguardando Documentação" para outra coluna no preview e confirmar que (a) não há listras de texto, (b) os cards de baixo permanecem estáticos durante o drag, (c) o overlay continua com `rotate-2 scale-105` e sombra.
