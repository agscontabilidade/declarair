## Diagnóstico
O sidecar `.ocr.pdf` gerado pelo OCR.space (free tier) cria uma camada de texto invisível com coordenadas/tamanhos que **não batem** com o raster do PDF original. Resultado: ao selecionar, o texto aparece gigante e desalinhado (como na imagem). Além disso, dispara OCR no servidor toda vez que um PDF escaneado é aberto pela primeira vez — custo desnecessário.

## Proposta
**Remover o swap automático para o sidecar OCR** e substituir por um botão sob demanda **"Copiar texto"** no toolbar do `PdfViewer`, que:

1. Para PDFs nativos (com texto real) → usa `pdf.js` direto, sem chamar servidor.
2. Para PDFs escaneados → roda OCR **uma vez sob demanda**, mostra o texto em um painel lateral selecionável/copiável. **Não** sobrepõe nada no PDF (zero risco de desalinhamento visual).

O PDF original continua renderizando com qualidade perfeita; nada de overlay quebrado.

## Mudanças

### `src/components/drive/FileViewerModal.tsx`
- Remover `getSearchablePdfUrl` / `invalidateSearchablePdfCache` do efeito principal e o `handleScannedPdfDetected`.
- Não passar mais `onScannedDetected` ao `PdfViewer`.
- O sidecar nunca mais é carregado automaticamente.

### `src/components/drive/viewers/PdfViewer.tsx`
- Remover prop `onScannedDetected` e a heurística de detecção.
- Adicionar botão **"Copiar texto"** (ícone `ClipboardCopy`) no toolbar inferior, ao lado do zoom.
- Ao clicar:
  - Tenta extrair texto nativo de todas as páginas via `pdf.getPage(n).getTextContent()`.
  - Se total > 50 chars → copia para clipboard + toast "Texto copiado".
  - Se vazio (escaneado) → chama edge function `ocr-pdf-extract-text` (novo modo `extractOnly`), copia o resultado, toast.
  - Loader no botão durante o processo.

### `supabase/functions/ocr-pdf-searchable/index.ts`
- Adicionar parâmetro `mode: 'searchable' | 'text'` (default mantém compat: `'searchable'`).
- Quando `mode === 'text'`: chama OCR.space sem `isCreateSearchablePdf`, retorna `{ text: string }` direto — sem upload de sidecar.
- Frontend chama apenas com `mode: 'text'` daqui pra frente.

### Sidecars antigos (`<path>.ocr.pdf`)
- Permanecem no storage mas **deixam de ser usados** pelo viewer.
- Não excluímos automaticamente (preserva histórico). Helpers `getSearchablePdfUrl` em `document-viewer-cache.ts` ficam órfãos — removo as referências mas mantenho as funções (uso futuro opcional) ou removo tudo se preferir limpeza total.

## Não faremos
- Não mexer em RLS, schema, ou outras rotas.
- Não trocar OCR provider (Lovable AI / Google Vision) — fora do escopo "melhorar sem mais servidor".
- Não excluir sidecars existentes (segurança/reversibilidade).

## Resultado para o usuário
- PDFs escaneados voltam a abrir limpos, sem overlay bugado.
- Quem precisa do texto clica em **"Copiar texto"** e recebe o conteúdo no clipboard.
- Servidor só é chamado quando o usuário pede explicitamente — custo praticamente zero por padrão.