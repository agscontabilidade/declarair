## Diagnóstico

O visualizador já passou a usar signed URL direto, cache em memória e prefetch de vizinhos, mas ainda há gargalos importantes:

1. `react-pdf` e `pdfjs` estão sendo carregados junto com as telas que importam `FileViewerModal`, antes mesmo de abrir um documento. No preview, `react-pdf.js` aparece como recurso grande (~180KB) e lento (~1,6s).
2. O cache atual vive dentro de cada instância do modal. Ao fechar/reabrir o visualizador ou abrir documentos por outro ponto da aplicação, os signed URLs são perdidos.
3. O prefetch atual faz `fetch(url)` completo para PDFs/imagens vizinhos. Isso pode competir com o arquivo atual e piorar a primeira abertura em conexões lentas.
4. O `PdfViewer` sempre renderiza a página com text layer assim que carrega. Isso mantém a seleção de texto, mas pode aumentar o tempo percebido no primeiro render.

## Plano de ajuste seguro

### 1. Carregar o viewer de PDF sob demanda
- Remover o import direto de `PdfViewer` dentro de `FileViewerModal`.
- Usar `React.lazy`/`Suspense` apenas quando o arquivo atual for PDF.
- Resultado: páginas `/declaracoes`, `/drive` e modais de documentos deixam de carregar `react-pdf` antes da necessidade real.

### 2. Cache compartilhado e persistente durante a sessão da aba
- Criar um pequeno utilitário em frontend para cache de documentos, fora do componente:
  - `signedUrl` por `arquivo_url`
  - `blobUrl` apenas quando necessário
  - `promise` para deduplicar requisições simultâneas
  - expiração um pouco antes do TTL do signed URL
- Usar esse cache no `FileViewerModal` para que fechar/reabrir o modal, ou abrir o mesmo documento em outro local, reaproveite o link imediatamente.

### 3. Prefetch sem competir com o arquivo atual
- Trocar o prefetch pesado por prefetch leve:
  - primeiro garantir apenas signed URL dos vizinhos;
  - só aquecer o browser cache após o arquivo atual já estar exibido;
  - limitar a no máximo anterior/próximo;
  - abortar corretamente ao trocar/fechar.
- Evitar baixar PDFs inteiros em background.

### 4. Melhorar o tempo percebido na troca de arquivos
- Ao navegar para o próximo/anterior, manter o shell do visualizador estável e trocar apenas o conteúdo.
- Mostrar o novo arquivo assim que houver signed URL, sem bloquear por blob.
- Para imagens, adicionar carregamento antecipado (`Image`) dos vizinhos após o documento atual aparecer.

### 5. Preservar segurança e regras atuais
- Não alterar banco, RLS, storage policies, upload, remoção, nem lógica de “lançado”.
- Não editar `src/integrations/supabase/client.ts` nem `types.ts`.
- Não adicionar dependências.
- Manter seleção/cópia de texto em PDF.
- Manter tela cheia, botões e navegação existentes.

## Arquivos previstos

- `src/components/drive/FileViewerModal.tsx`
  - usar cache compartilhado, lazy PDF viewer e prefetch mais leve.
- `src/components/drive/viewers/PdfViewer.tsx`
  - pequenos ajustes se necessário para lazy import e render mais estável.
- possível novo arquivo frontend pequeno, por exemplo `src/lib/document-viewer-cache.ts`
  - cache isolado e reutilizável, sem backend.

## Validação

- Conferir que `/declaracoes` e `/drive` não carregam `react-pdf` antes de abrir PDF.
- Abrir um PDF e verificar que aparece sem baixar tudo antes.
- Navegar anterior/próximo e confirmar reaproveitamento de signed URL/cache.
- Confirmar que texto do PDF continua selecionável e copiável.
- Confirmar que “Marcar como lançado” continua funcionando sem alteração de regra.