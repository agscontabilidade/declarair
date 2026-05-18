## Diagnóstico

O componente `src/components/drive/viewers/PdfViewer.tsx` renderiza PDFs assim:

```tsx
<iframe src={`${url}#toolbar=1&navpanes=0`} ... />
```

Onde `url` é uma **blob: URL** criada em `FileViewerModal.tsx` (fetch + Blob com MIME forçado).

Esse esquema falha justamente no contexto da Lovable: o preview da app roda **dentro de um iframe** (preview da plataforma) e o `<iframe>` do PdfViewer fica como **iframe aninhado dentro de iframe**, carregando uma `blob:` URL. O visualizador PDF nativo do Chrome (PDFium) frequentemente recusa renderizar nesse cenário e exibe **tela em branco / cinza**, sem disparar erro JS — exatamente o sintoma relatado. Em produção (sem o iframe de preview) o problema pode aparecer também quando o storage devolve o PDF com `Content-Disposition: attachment`.

A correção robusta é parar de depender do plugin nativo de PDF do navegador e renderizar o PDF via **pdf.js** em `<canvas>`, que funciona em qualquer contexto (preview, produção, mobile, iframes aninhados).

## Mudanças

### 1. Dependências
- Adicionar `react-pdf` (wrapper React do pdf.js, já vendoreza o worker).

### 2. `src/components/drive/viewers/PdfViewer.tsx` (reescrever)
- Usar `Document` e `Page` do `react-pdf`.
- Configurar o worker uma vez (`pdfjs.GlobalWorkerOptions.workerSrc` apontando para o worker bundled, via `import.meta.url`).
- Estado local: `numPages`, `pageNumber`, `scale`.
- Layout:
  - Área scrollável central com `<Document file={url}>` + `<Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />`.
  - Barra inferior compacta com: «‹ Página X de N ›» e botões `−` / `100%` / `+` para zoom.
- `file` recebe a `inlineUrl` (blob) que já vem do `FileViewerModal`. react-pdf aceita blob URL sem problema porque processa via `fetch` interno, não via plugin do browser.
- Loading state com `Skeleton` enquanto `Document` carrega.
- onError → mostrar mensagem "Não foi possível renderizar este PDF" com link para o botão "Abrir em nova aba" do header.

### 3. `src/components/drive/FileViewerModal.tsx`
- Sem mudanças funcionais necessárias. O fluxo de signed URL + blob com MIME forçado continua válido (já garante que arquivos com `Content-Disposition: attachment` consigam ser exibidos inline pelo react-pdf).
- Confirmar que `getFileType` continua mapeando `pdf` → `PdfViewer`.

### 4. CSS
- Importar os estilos opcionais do react-pdf para a página: `react-pdf/dist/Page/AnnotationLayer.css` e `react-pdf/dist/Page/TextLayer.css` (apenas se ativarmos os layers; vamos desativar ambos para performance, então pode ficar fora).

### 5. Verificação
- Após implementação, abrir `/drive`, clicar em um PDF — deve renderizar a primeira página em canvas, navegar entre páginas e dar zoom.
- Testar também o modal dentro de `/declaracoes/:id` → "Documentos da Declaração" (mesmo `FileViewerModal`).
- Outros visualizadores (imagem, texto, office, unsupported) **não são tocados** — escopo estrito.

## Escopo

Alterações somente em:
- `package.json` (nova dep)
- `src/components/drive/viewers/PdfViewer.tsx` (reescrita)

Nenhuma mudança em banco, RLS, edge functions ou demais componentes.
