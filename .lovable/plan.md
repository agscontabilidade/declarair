## Diagnóstico

PDFs digitais nativos já são selecionáveis (o `PdfViewer` renderiza `renderTextLayer={true}`). O problema é com PDFs **escaneados** (imagem dentro de PDF): não têm camada de texto, então o pdf.js não tem o que selecionar.

Solução definitiva: gerar uma versão **"searchable PDF"** (mesma imagem + camada de texto invisível via OCR) e servir essa versão no visualizador quando o original for um PDF escaneado. Sem mexer em upload, kanban, checklist, formulários, RLS ou estrutura de tabelas.

## Estratégia: sidecar em storage + OCR sob demanda

Para cada PDF em `documentos-clientes/<path>.pdf`, geramos um sidecar:
```
documentos-clientes/<path>.pdf            ← original (não é tocado)
documentos-clientes/<path>.ocr.pdf        ← versão pesquisável (gerada quando necessário)
```

O visualizador, ao abrir um PDF:
1. Verifica se já existe `<path>.ocr.pdf` no storage → usa esse (instantâneo).
2. Senão, carrega o original e, **em paralelo**, faz uma checagem rápida de qualidade do texto extraído (≥500 chars + ≥100 letras, mesmo critério já usado no `processar-pdf-declaracao`).
3. Se o texto for ruim → chama edge function `ocr-pdf-searchable` que gera e salva o sidecar; ao concluir, troca a URL do viewer para o sidecar (toast discreto "PDF pesquisável pronto").
4. Se o texto for bom → não faz nada; original já é selecionável.

Resultado: usuário **sempre** consegue selecionar texto, sem precisar reabrir o documento e sem alterar nenhum fluxo upstream.

## Componentes

### 1. Nova edge function `ocr-pdf-searchable`
- Input: `{ path: string }` (caminho no bucket `documentos-clientes`).
- Validações: JWT obrigatório; valida que o usuário tem permissão de leitura no `path` (via signed URL próprio do caller — mesma lógica do viewer).
- Idempotente: se `<path>.ocr.pdf` já existe, retorna `{ status: 'ready', path }`.
- Lock: usa `INSERT ... ON CONFLICT DO NOTHING` em uma tabela leve `ocr_jobs (path PK, status, created_at)` para evitar duas chamadas processarem o mesmo arquivo simultaneamente.
- Fluxo OCR (provedor: **OCR.space**, já temos `OCRSPACE_API_KEY`):
  - Baixa o PDF via service role.
  - POST para `https://api.ocr.space/parse/image` com `isCreateSearchablePdf=true`, `isSearchablePdfHideTextLayer=true`, `OCREngine=2`, `language=por`.
  - Recebe URL do searchable PDF, baixa o arquivo e faz upload em `<path>.ocr.pdf` (mesma pasta, mesmas permissões — herda RLS do bucket).
  - Marca job como `ready`. Em falha, marca `failed` com erro; o viewer continua mostrando o original (degrada silenciosamente).
- Limite: OCR.space gratuito aceita até 3MB / 3 páginas. Para PDFs maiores: marcar job como `skipped_too_large` e logar; fica como follow-up futuro (plano pago ou Tesseract self-hosted no Deno — fora deste escopo para não estourar custo).

### 2. Tabela `ocr_jobs` (única mudança de DB, mínima)
```
ocr_jobs(
  path text primary key,
  status text not null check (status in ('processing','ready','failed','skipped_too_large')),
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```
- Sem RLS de usuário (acesso só via service role na edge function).
- GRANT só para `service_role`.

### 3. Camada de cache no frontend (`src/lib/document-viewer-cache.ts`)
Adiciona `getSearchablePdfUrl(path)`:
- Verifica em memória se já resolveu para esse path.
- Faz `supabase.storage.from('documentos-clientes').list(folder, { search: '<name>.ocr.pdf' })` (1 chamada barata) → se existe, retorna o signed URL do sidecar.
- Senão, retorna `null`.

### 4. Pequeno ajuste no `PdfViewer.tsx`
- Após `onLoadSuccess`, faz uma checagem rápida da página 1: `page.getTextContent()` → conta caracteres.
- Se < 50 chars na página 1 (heurística de scaneado) **e** `current.arquivo_url` ainda é o original, dispara `supabase.functions.invoke('ocr-pdf-searchable', { body: { path }})`.
- Quando a função retorna `ready`, chama callback do `FileViewerModal` para trocar `inlineUrl` pelo signed URL do sidecar. Toast: "PDF pesquisável pronto".
- Sem checagem se já é sidecar (`.ocr.pdf` no nome) — evita loop.

### 5. `FileViewerModal.tsx`
- No effect que busca URL, **antes** de pegar o original, chama `getSearchablePdfUrl(path)`. Se existir, usa direto.
- Adiciona prop/callback `onSearchableReady(newUrl)` que o `PdfViewer` invoca após OCR concluir.

## O que NÃO muda

- Nenhum fluxo de upload, kanban, checklist, declaração, billing, RLS, auth.
- Nenhum componente fora de `FileViewerModal`, `PdfViewer`, `document-viewer-cache`.
- Tabelas existentes intocadas (só adição de `ocr_jobs`).
- PDFs digitais nativos continuam funcionando exatamente como hoje (zero overhead — heurística só dispara quando texto é ruim).
- Sidecar fica no mesmo bucket/pasta → herda exatamente as mesmas policies RLS do original. Quem vê o PDF original vê o `.ocr.pdf`.

## Backfill (opcional, segunda fase)

Script `npm run backfill-ocr` (ou cron noturno) que percorre `documentos-clientes` e chama `ocr-pdf-searchable` para PDFs sem sidecar. **Não faz parte deste deploy** — implementação inicial gera sob demanda conforme contadores abrem documentos. Discutimos depois se vale a pena rodar em massa.

## Aceitação

- Abrir PDF nativo selecionável → continua selecionável, sem chamadas extras.
- Abrir PDF escaneado pela 1ª vez → carrega original, toast "Gerando versão pesquisável…", em ~5-15s troca para sidecar com texto selecionável.
- Reabrir o mesmo PDF escaneado → carrega direto o sidecar (instantâneo).
- PDF > 3MB / muitas páginas → continua abrindo normalmente, sem OCR (degrada silenciosamente, logado).
- Falha de OCR → original continua acessível, sem erro visível ao contador.

## Riscos & mitigações

- **Custo OCR.space**: free tier é 25k chamadas/mês. Suficiente para começar; monitorar via `ocr_jobs`.
- **Latência**: OCR roda async; viewer não bloqueia. Original fica visível durante o processo.
- **Sidecar órfão se original for deletado**: adicionar trigger futuro para limpeza — fora deste escopo (não quebra nada, só ocupa storage).

Aprove para eu implementar.