## Diagnóstico

O `PdfViewer` já liga `renderTextLayer={true}` e importa `react-pdf/dist/Page/TextLayer.css` — então a camada de texto invisível do pdf.js (a mesma técnica que o Adobe usa) **é renderizada** para PDFs nativos. Confirmei no `node_modules`:

- `react-pdf` v10 aplica `position: relative` inline em `.react-pdf__Page`.
- `TextLayer.css` posiciona `.textLayer` com `inset: 0; z-index: 2;` e dá `cursor: text` aos `span`s.

Portanto a infraestrutura está certa. O motivo da seleção não estar funcionando para PDFs nativos é provavelmente uma das três causas, todas frontend-only e **sem custo de servidor**:

1. **Canvas interceptando o evento de seleção** — pdf.js pinta o canvas e a camada de texto por cima, mas, dependendo do navegador, arrastar começa no canvas e o navegador não promove para `selection` da camada de texto sem `pointer-events: none` no `<canvas>`.
2. **Algum ancestral (Dialog do shadcn, sidebar, etc.) propagando `user-select: none`** ou `onMouseDown` que faz `preventDefault`.
3. **`disableStream/disableAutoFetch` ativos** combinados com algum servidor de storage que retorna o PDF inteiro de uma vez — irrelevante para seleção, mas vale confirmar.

## Mudanças propostas (escopo estrito: só seleção de PDF nativo)

### 1. `src/index.css` — adicionar bloco mínimo dedicado ao viewer

```css
/* Garante que a camada de texto invisível do pdf.js fique selecionável
   sobre o canvas, sem que o canvas roube o pointer/seleção. */
.react-pdf__Page { user-select: text; -webkit-user-select: text; }
.react-pdf__Page__canvas { pointer-events: none; user-select: none; }
.react-pdf__Page__textContent,
.react-pdf__Page .textLayer { user-select: text; -webkit-user-select: text; cursor: text; }
.react-pdf__Page .textLayer span,
.react-pdf__Page .textLayer br { user-select: text; -webkit-user-select: text; }
```

Isso resolve as causas (1) e (2) sem mexer em nenhum componente. Nada de novo é renderizado.

### 2. `src/components/drive/viewers/PdfViewer.tsx` — limpeza pontual

- Remover `className="select-text"` redundante do `<Page>` (o CSS acima já garante).
- Manter o resto do componente intacto — toolbar, "Copiar texto", paginação, zoom, fallback de blob, OCR sob demanda.

### 3. Pequena melhoria de descoberta

- Quando o PDF nativo for detectado (texto extraído tem ≥ 50 chars na primeira página), trocar o tooltip do botão para **"PDF selecionável — use Ctrl+F do navegador ou arraste para selecionar"**.
- Quando não houver texto nativo, manter o atual "Copiar texto" que dispara OCR sob demanda (já implementado, sem custo recorrente).

Detecção feita uma única vez no `onLoadSuccess` (leitura da primeira página via `getTextContent()`), guardada em estado. Custo zero adicional — é a mesma chamada que o "Copiar texto" já faria.

## Validação

1. Abrir um informe de rendimentos do banco (PDF nativo) em `/declaracoes/:id?doc=...`.
2. Arrastar o mouse sobre um trecho → deve aparecer cursor de texto + seleção azul + Ctrl+C funcionando.
3. Ctrl+F do navegador deve achar palavras dentro do PDF.
4. Abrir um documento escaneado (foto) → seleção não acontece (esperado), botão "Copiar texto" continua disparando OCR sob demanda.

## O que NÃO está no escopo

- Nenhuma chamada extra de OCR para PDFs nativos.
- Nenhuma mudança em banco, RLS, storage, edge functions.
- Nenhuma mudança no fluxo de upload — o arquivo original continua sendo o mesmo PDF nativo que o usuário enviou.
