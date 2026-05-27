## Objetivo

Unificar o comportamento do visualizador de arquivos em `/drive` e em `/declaracoes`:

1. `/drive` passa a exibir o botão **"Marcar como lançado"** no topo do `FileViewerModal` (já presente em `/declaracoes`).
2. Alternar "lançado" em qualquer um dos dois lugares reflete imediatamente no outro (invalidação cruzada de cache).
3. Garantir que todos os PDFs sejam selecionáveis (text layer sempre ativo).

---

## Escopo (mínimo necessário)

### 1. `/drive` — exibir e gravar `lancado`

Arquivo: `src/pages/Drive.tsx`

- Adicionar `lancado` ao `select` da query `drive-docs` e ao tipo `DocWithDeclaracao`.
- Incluir `lancado` no objeto `ViewerFile` criado em `openViewer`.
- Adicionar uma mutation `toggleLancado` igual à de `DocumentosDeclaracaoModal.tsx` (linhas 157-177): atualiza `checklist_documentos` com `lancado`, `lancado_em`, `lancado_por`.
- No `onSuccess`, invalidar **as três** query keys para refletir em todas as telas:
  - `['drive-docs']`
  - `['documentos-declaracao']`
  - `['declaracao-aba-docs']`
  - `['declaracao-checklist']`
- Passar `onToggleLancado` e `togglingLancadoId` para o `<FileViewerModal>`.

### 2. `/declaracoes` — invalidar também o cache do Drive

Arquivos: `src/components/declaracoes/DocumentosDeclaracaoModal.tsx` e `src/components/declaracao/AbaDocumentosUnificada.tsx`

- Adicionar `queryClient.invalidateQueries({ queryKey: ['drive-docs'] })` ao `onSuccess` da mutation `toggleLancado` existente nos dois arquivos (hoje só invalidam as queries da declaração).

### 3. Seleção de texto em PDFs

Arquivo: `src/components/drive/viewers/PdfViewer.tsx`

- Já está com `renderTextLayer={true}`, `select-text` no wrapper e o CSS `react-pdf/dist/Page/TextLayer.css` importado. Apenas **confirmar** que segue assim — sem mexer.
- **Limitação importante**: PDFs digitalizados/escaneados (como muitos recibos da RFB) não possuem text layer no arquivo; nenhum visualizador web torna esse tipo selecionável sem OCR. O comportamento atual já é o máximo possível sem rodar OCR no servidor.

---

## Detalhes técnicos

**Tipo `ViewerFile`** (`FileViewerModal.tsx`) já aceita `lancado?: boolean` e já renderiza o botão quando `onToggleLancado` é passado — nenhuma mudança nele.

**Schema**: `checklist_documentos` já tem as colunas `lancado`, `lancado_em`, `lancado_por`. Sem migration.

**RLS**: A policy `Atualizar checklist do escritorio` já permite update por qualquer usuário do escritório dono da declaração — funciona para o Drive sem alteração.

---

## Não está no escopo

- Refatorar a mutation em um hook compartilhado (manteremos duplicada em 3 lugares para evitar mudanças além do pedido).
- OCR de PDFs escaneados.
- Alterações de layout/estilo do header/footer do visualizador.
- Qualquer mudança em outras telas.

---

## Arquivos a alterar

```
src/pages/Drive.tsx                                          (query + mutation + props do modal)
src/components/declaracoes/DocumentosDeclaracaoModal.tsx     (1 linha: invalidar drive-docs)
src/components/declaracao/AbaDocumentosUnificada.tsx         (1 linha: invalidar drive-docs)
```

Nenhum arquivo é criado ou removido.
