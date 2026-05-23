# Auditoria: Documentos Pendentes no Dashboard

## Erros encontrados

1. **Ícone de exclamação amarelo (⚠️) no KanbanCard** — `KanbanCard.tsx:34,81` usa `isStale()` (>7 dias sem alteração) e aplica em **qualquer status, inclusive `transmitida`**. Por isso declarações já transmitidas há mais de uma semana exibem alerta no Kanban.

2. **Barra de progresso "X/Y documentos" + badge "N pendente(s)"** — `KanbanCard.tsx:88-107` e `DeclaracoesListView.tsx:79-88` leem a tabela legacy `checklist_documentos`. Esse checklist foi descontinuado na UI (contador hoje envia documentos livremente via Drive/`DocumentosDeclaracaoModal`), mas os registros antigos continuam no banco e alimentando esses contadores enganosos.

3. **Dados confirmados no banco** (ano 2026):
   - 14 declarações `transmitida` ainda têm **128 itens** no checklist legacy, sendo 4 com `status='pendente'` → aparecem como "1 pendente" no card mesmo já transmitidas.
   - 39 `aguardando_documentos` com 150 pendentes (irrelevante, pois o status já comunica isso).

4. **Query extra desnecessária** — `useDashboardData.ts:85-98` faz round-trip adicional para `checklist_documentos` em todo refresh do Dashboard, só para alimentar UI que será removida.

5. **KPI "Doc. Pendente"** (`KpiCards`) está OK — conta declarações com `status='aguardando_documentos'`, não usa o checklist. Mantém.

## Plano de ajuste

### 1. `src/components/dashboard/KanbanCard.tsx`
- Remover totalmente o bloco da barra de progresso (linhas 88-94) e o badge "N pendente(s)" (linhas 103-107).
- Remover import de `Progress` e `FileText` se não restarem usos.
- Manter o ícone stale apenas para status não-finalizados: `stale && item.status !== 'transmitida'`.
- Remover `totalDocs`/`pendingDocs`/`receivedDocs`/`docPct` do componente.

### 2. `src/components/dashboard/DeclaracoesListView.tsx`
- Remover a coluna "Documentos" inteira (header + cell + `<Progress>`).
- Remover cálculo de `totalDocs/receivedDocs/docPct`.

### 3. `src/hooks/useDashboardData.ts`
- Remover a segunda query a `checklist_documentos` e os maps `pendingMap`/`totalMap`.
- Remover `pendingDocs` e `totalDocs` da interface `DeclaracaoKanban`.

### 4. (Opcional, limpeza de dados) Migration
- Marcar como `recebido` os 4 itens `pendente` em declarações já `transmitida`, só por higiene — não afeta UI após as mudanças acima. Posso pular se preferir.

## Resultado esperado
- Card e lista do Dashboard **deixam de mostrar qualquer aviso de documento faltante**.
- Declarações `transmitida` não exibem mais ícone de alerta.
- A única sinalização de pendência de documentos passa a ser o próprio status `aguardando_documentos` (cor + KPI), coerente com o fluxo atual ("ou tem documentos ou não tem").

Confirma que sigo com os 3 ajustes (e me diz se quer o item 4 de limpeza)?
