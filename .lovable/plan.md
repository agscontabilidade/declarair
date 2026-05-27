## Objetivo

1. Restaurar a seleção de texto nos PDFs anexados.
2. Reduzir a altura do header e do rodapé do visualizador para dar mais área útil ao documento.

## 1. Seleção de texto no PDF

O `PdfViewer` já está configurado corretamente para permitir seleção:
- `renderTextLayer={true}` no `<Page>`
- CSS do TextLayer importado (`react-pdf/dist/Page/TextLayer.css`)
- `className="select-text"` no `<Page>`

Ou seja, **não removi essa funcionalidade** — o código de seleção continua intacto desde a última versão. O que pode estar atrapalhando é a camada de anotação/CSS herdada do Dialog. Vou:

- Garantir que o wrapper do PDF em `PdfViewer.tsx` não tenha `select-none` herdado, adicionando explicitamente `select-text` no container do `<Document>`.
- Confirmar que o `react-pdf/dist/Page/TextLayer.css` está sendo aplicado (ele depende do `.textLayer` gerado pelo pdf.js — se um CSS global zerar `pointer-events` ou `user-select`, a seleção quebra).
- Verificar visualmente no preview, abrindo um PDF e tentando selecionar texto.

Nenhuma mudança de lógica, só garantia de CSS.

## 2. Mais área de visualização (header/rodapé mais finos)

Alterações puramente visuais, sem mexer em comportamento:

**`src/components/drive/FileViewerModal.tsx` (header)**
- `p-3` → `px-3 py-1.5` no header.
- Botões: `size="icon"` continua, mas com classe `h-8 w-8` (hoje é o default de 40px).
- Ícone do tipo: `h-5 w-5` → `h-4 w-4`.
- Body: `p-3` → `p-2` para sobrar mais espaço.

**`src/components/drive/viewers/PdfViewer.tsx` (rodapé)**
- Barra inferior: `p-2` → `py-1 px-2`.
- Botões já são `h-8 w-8`; mantém.
- Ajuste de `gap-2` → `gap-1` na barra inferior para compactar.

Resultado: ganho de ~20–25px no topo e ~10px embaixo, sem remover nenhum controle.

## Escopo estrito

- Só edito `FileViewerModal.tsx` e `PdfViewer.tsx`.
- Nenhuma mudança de RLS, banco, edge function, ou outros componentes.
- Nenhuma remoção de botão ou funcionalidade.

## Verificação

Após aplicar, abro um PDF no preview e:
1. Tento selecionar texto com o mouse.
2. Confirmo visualmente que header e rodapé ficaram mais finos.