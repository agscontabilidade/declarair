## Visualização inline 100% confiável (sem download forçado)

### Por que alguns PDFs abrem e outros baixam hoje

Quando o cliente envia um arquivo, o storage guarda junto o cabeçalho `Content-Type`. Em alguns uploads esse header vem como `application/octet-stream` (arquivo "genérico"), ou com `Content-Disposition: attachment`. Resultado: ao colocar a URL assinada num `<iframe>`, o navegador respeita o header do servidor e **força o download** em vez de renderizar.

PDFs enviados com o tipo correto funcionam; os enviados sem MIME explícito disparam o download. Mesmo sintoma para imagens.

### Solução: blob inline com MIME forçado

Em vez de jogar a URL assinada direto no iframe/img, vamos:

1. Fazer **fetch** da URL assinada → obter os bytes do arquivo.
2. Criar um **`Blob`** com o **MIME correto** deduzido pela extensão do nome (ex.: `.pdf` → `application/pdf`).
3. Gerar um **`URL.createObjectURL(blob)`** (URL `blob:` local, que o navegador sempre abre inline).
4. Passar esse blob URL para o `<iframe>` (PDF) ou `<img>` (imagem) ou `<pre>` (texto).

Como o blob URL é controlado pelo nosso código no navegador, o `Content-Type` é exatamente o que definimos — o browser **nunca** vai forçar download. Comportamento idêntico para todos os arquivos, sempre.

Office (DOCX/XLSX/PPTX) continua usando o Microsoft Office Online Viewer com a URL assinada original (ele exige uma URL pública e renderiza no próprio iframe da Microsoft).

### Bônus: indicador de carregamento e gestão de memória

- Skeleton enquanto baixa o blob (arquivos grandes).
- `URL.revokeObjectURL()` no cleanup para liberar memória ao trocar de arquivo ou fechar o modal.
- Toast de erro caso o fetch falhe.

### Arquivos alterados

1. **`src/lib/file-types.ts`** — adicionar mapa de extensão → MIME e função `getMimeFromName(nome)`.
2. **`src/components/drive/FileViewerModal.tsx`** — substituir lógica que apenas pega `signedUrl` pela rotina fetch → blob → object URL (exceto para Office, que continua usando signed URL). Limpar object URL no cleanup.

Sem mudanças em PdfViewer, ImageViewer, TextViewer (já recebem a URL como prop).

### Resultado esperado

Todos os PDFs abrem dentro do sistema sem download. Imagens idem. Word/Excel/PowerPoint dentro do viewer da Microsoft. Texto plano dentro do modal. Comportamento consistente independente de como o arquivo foi enviado.
