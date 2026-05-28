## Problema

O botão "Excluir documento" no `FileViewerModal` só aparece quando o componente pai passa `onDelete`. Hoje isso só acontece em `src/pages/Drive.tsx`. Quando o visualizador é aberto pela tela de detalhe da declaração (`/declaracoes/:id` — onde o usuário está agora), ele é renderizado por `AbaDocumentosUnificada` e por `DocumentosDeclaracaoModal` sem `onDelete`, então o ícone da lixeira não aparece.

## Solução

Extrair a mutação de exclusão usada hoje em `Drive.tsx` para um hook compartilhado e plugá-lo nos outros dois usos do `FileViewerModal`. Sem mudanças de schema, RLS, UI do modal ou comportamento de toggle "lançado".

### 1. Novo hook `src/hooks/useDeleteDocumento.ts`

- Recebe a lista atual `viewerFiles` e callbacks (`onAfterDelete(remainingFiles, nextId)`) do chamador.
- Faz o mesmo que o `deleteDoc` atual em `Drive.tsx`:
  1. Remove `arquivo_url` e o sidecar `${path}.ocr.pdf` do bucket `documentos-clientes` (best-effort).
  2. `update` em `checklist_documentos` zerando `arquivo_url`, `arquivo_nome`, `data_recebimento`, `status='pendente'`, `lancado=false`, `lancado_em=null`, `lancado_por=null`.
  3. Invalida `['drive-docs']`, `['documentos-declaracao']`, `['declaracao-aba-docs']`, `['declaracao-checklist']`.
  4. Toasts de sucesso/erro idênticos.
- Expõe `{ deleteDoc, deletingId }`.

### 2. `src/pages/Drive.tsx`

- Substituir o `useMutation` local pelo novo hook, mantendo o comportamento atual (cálculo do próximo `viewerCurrentId` no `onAfterDelete`).

### 3. `src/components/declaracao/AbaDocumentosUnificada.tsx`

- Usar o hook e passar `onDelete` + `deletingId` para o `FileViewerModal` (linhas 345–351).
- No `onAfterDelete`, atualizar `viewerFiles` local e mover `viewerCurrentId` para o próximo arquivo (ou fechar se vazio), espelhando o Drive.

### 4. `src/components/declaracoes/DocumentosDeclaracaoModal.tsx`

- Mesmo tratamento do item 3 para o `FileViewerModal` (linhas 384–390).

### 5. `src/components/declaracao/SecaoAnaliseCaixa.tsx`

- **Não alterar.** Esse visualizador é da Análise de Caixa (arquivos em `_analise_caixa/`), fluxo diferente, e não havia exclusão antes.

## Validação

- Abrir `/declaracoes/:id?doc=...` → ícone de lixeira aparece no header do viewer; confirmação pede "Excluir"; após confirmar, arquivo some, lista do Drive/abas atualiza, checklist volta a "pendente".
- Repetir abrindo pelo `DocumentosDeclaracaoModal` (botão Documentos no card).
- `Drive.tsx` continua funcionando igual.
