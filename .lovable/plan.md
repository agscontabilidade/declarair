## Diagnóstico da lentidão atual

Em `src/components/drive/FileViewerModal.tsx` o fluxo de abertura é:

1. `createSignedUrl` (1 round-trip ao Storage)
2. `fetch(signedUrl)` baixando o **arquivo inteiro** em `ArrayBuffer`
3. Cria `Blob` + `URL.createObjectURL` e só então entrega ao `PdfViewer`

Consequências:
- O PDF só começa a renderizar **depois** do download completo (sem streaming).
- Trocar de arquivo refaz tudo do zero, mesmo voltando a um já aberto.
- Não há pré-busca do próximo/anterior.
- O `pdf.js` suporta Range Requests nativamente; o Supabase Storage também — estamos desperdiçando isso ao baixar tudo como ArrayBuffer.

## O que mudar (apenas no visualizador)

### 1. Cache em memória durante a sessão do modal
Criar um `useRef<Map<id, { signedUrl, blobUrl?, mime }>>`. Ao trocar de arquivo, se já estiver no cache, exibir **instantaneamente** sem nenhum fetch. Blob URLs criados ficam vivos até o `onClose` (revogados em lote).

### 2. PDFs: streaming direto (sem ArrayBuffer)
Passar a `signedUrl` diretamente para o `<Document file={...}>` do `react-pdf`. O `pdf.js` faz range requests e renderiza a **primeira página antes** do arquivo inteiro chegar — ganho perceptível enorme em PDFs grandes (extratos, informes). Mantemos blob como fallback se o `onLoadError` disparar (alguns servidores não honram Range).

### 3. Imagens/texto: usar `signedUrl` direto quando possível
- Imagens: `<img src={signedUrl}>` — o browser faz cache HTTP nativo, sem precisar baixar tudo em JS.
- Texto: manter fetch (precisa do conteúdo como string), mas com cache.
- Office: já usa `signedUrl` direto, sem mudança.

### 4. Pré-busca dos vizinhos
Ao abrir um arquivo, em background (sem bloquear UI):
- Gerar `signedUrl` do anterior e do próximo.
- Para PDFs/imagens, fazer um `fetch` HEAD/GET leve apenas para aquecer o cache HTTP do browser.

Resultado: clicar em "próximo" abre **sem latência perceptível**.

### 5. Pequenas otimizações no `PdfViewer`
- Memoizar o objeto `options` do `<Document>` para evitar re-criação do PDF a cada render.
- Manter `renderTextLayer` (já necessário para seleção de texto — não regredir).
- Não tocar em mais nada.

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| `src/components/drive/FileViewerModal.tsx` | Cache por id, PDF/imagem via signedUrl direto com fallback para blob, prefetch de vizinhos, revogação de blobs no unmount |
| `src/components/drive/viewers/PdfViewer.tsx` | Memoizar `options` do `<Document>`; sem mudança de comportamento visual |

## O que NÃO muda

- Nenhuma alteração de schema, RLS, queries ou lógica de "lançado".
- Nenhuma alteração nos outros viewers além do necessário para aceitar `signedUrl`.
- UI/UX visual idêntica — só fica mais rápida.
- Sem novas dependências.

## Riscos / mitigação

- **Range request não suportado** em algum ambiente → `onLoadError` do `react-pdf` aciona fallback que baixa via fetch+blob (comportamento atual).
- **Vazamento de blob URLs** → revogados em lote no unmount do modal e ao limpar cache.
- **Custos de prefetch** → limitado a 2 vizinhos e abortado se o usuário fechar o modal (`AbortController`).
