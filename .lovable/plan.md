## Visualizador de Arquivos no Drive

Hoje no módulo **Drive de Documentos**, o contador só consegue **baixar** os arquivos enviados pelos clientes. A proposta é adicionar um **visualizador integrado** (modal em tela cheia) que abre o arquivo direto no sistema, sem download, suportando os tipos mais comuns enviados na rotina de IRPF.

### O que vai mudar para o usuário

- Ao clicar no nome do arquivo (ou em um novo botão de "olho" 👁️), abre um modal grande com o documento renderizado.
- Botões no topo do visualizador: **Baixar**, **Abrir em nova aba**, **Fechar**, e navegação **Anterior / Próximo** entre os arquivos da mesma pasta do cliente.
- Indicador de tipo de arquivo e nome no cabeçalho.
- Botão de **download** atual continua funcionando (não vamos remover).

### Tipos de arquivo suportados

| Tipo | Como será exibido |
|---|---|
| **PDF** | Renderizado nativamente em `<iframe>` com URL assinada (zoom, scroll, busca do navegador) |
| **Imagens** (JPG, JPEG, PNG, WEBP, GIF, BMP) | Tag `<img>` com zoom (clique para 100%/ajustar) |
| **Texto / CSV / JSON / XML** | `<pre>` com fonte mono e scroll |
| **Word / Excel / PowerPoint** (DOCX, XLSX, PPTX, DOC, XLS, PPT) | Renderizado via **Microsoft Office Online Viewer** (iframe público da Microsoft que aceita URL assinada) — não exige login, funciona para escritórios |
| **Outros** (ZIP, RAR, etc.) | Mensagem amigável: "Pré-visualização não disponível para este formato" + botão Baixar |

### Como funcionará tecnicamente

```text
[Drive.tsx]
   │ clica em arquivo
   ▼
[FileViewerModal]
   │ detecta extensão → escolhe renderer
   ▼
 ┌─────────────┬─────────────┬──────────────┬──────────────┐
 │ PdfViewer   │ ImageViewer │ TextViewer   │ OfficeViewer │
 │ <iframe>    │ <img>       │ fetch+<pre>  │ MS iframe    │
 └─────────────┴─────────────┴──────────────┴──────────────┘
```

- Continua usando **`createSignedUrl`** do bucket privado `documentos-clientes` (TTL 1h) — segurança preservada, RLS intacto.
- Para Office, a URL assinada é passada como parâmetro para `https://view.officeapps.live.com/op/embed.aspx?src=<URL>` — é um serviço gratuito da Microsoft, não envia dados pessoais para terceiros além da própria Microsoft (mesmo modelo já usado pelo Outlook/SharePoint).
- Texto puro é baixado via `fetch` da URL assinada e mostrado dentro do modal.

### Arquivos a criar / alterar

1. **Criar** `src/components/drive/FileViewerModal.tsx` — componente principal com Dialog (shadcn), navegação entre arquivos, header com ações.
2. **Criar** `src/components/drive/viewers/` com sub-componentes:
   - `PdfViewer.tsx`
   - `ImageViewer.tsx`
   - `TextViewer.tsx`
   - `OfficeViewer.tsx`
   - `UnsupportedViewer.tsx`
3. **Criar** `src/lib/file-types.ts` — função utilitária `getFileType(nomeArquivo)` que retorna `'pdf' | 'image' | 'text' | 'office' | 'unsupported'`.
4. **Alterar** `src/pages/Drive.tsx`:
   - Adicionar estado `viewerFile` e lista achatada de arquivos da pasta atual (para navegação anterior/próximo).
   - Adicionar botão 👁️ ao lado do botão de download em cada arquivo.
   - Tornar o nome do arquivo clicável (abre o viewer).
   - Renderizar `<FileViewerModal />` no fim da página.

### Pontos de atenção

- **Sem download forçado**: o `<iframe>` para PDF usa `#toolbar=1&navpanes=0` para evitar baixar automaticamente.
- **Imagens grandes**: aplicar `max-h-[85vh] object-contain` para caber no modal.
- **Atalhos de teclado**: `←` / `→` para navegar, `Esc` para fechar (já vem do Dialog).
- **Mobile**: modal full-screen em telas pequenas (`sm:max-w-5xl` no desktop, `w-full h-full` no mobile).
- **Sem dependências novas**: usa só shadcn Dialog + iframe nativo + Office Online Viewer público. Não precisa instalar `react-pdf`, `pdfjs`, `mammoth`, etc.

Posso prosseguir com a implementação?
