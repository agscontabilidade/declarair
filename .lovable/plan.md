## Objetivo
Aprimorar o visualizador de documentos (`FileViewerModal`) usado pelos contadores:
1. Abrir em **tela cheia**.
2. Permitir **seleção e cópia de texto** em PDFs.
3. Adicionar botão **"Marcar como lançado"** no visualizador.
4. Na lista de documentos, documento lançado fica com **card verde + ícone "✓"** e **tooltip** "Documento lançado".

Tudo isolado a essa funcionalidade, sem mexer em lógica existente (upload, remoção, sync com Drive, status do checklist, kanban, RLS).

---

## Mudanças

### 1. Banco — nova coluna em `checklist_documentos`
Adicionar 2 campos opcionais (sem quebrar nada existente):
- `lancado boolean NOT NULL DEFAULT false`
- `lancado_em timestamptz NULL` — registra quando foi marcado (auditoria leve)
- `lancado_por uuid NULL` — `auth.uid()` no momento da marcação

RLS: as policies de UPDATE existentes (`Atualizar checklist do escritorio`) já cobrem — nenhum ajuste necessário. Sem nova policy, sem alterar `status` (continua `pendente|recebido|dispensado`). "Lançado" é ortogonal ao status.

Índice: `CREATE INDEX idx_checklist_lancado ON checklist_documentos(declaracao_id) WHERE lancado = true;` (otimização leve para futuros contadores de "lançados").

### 2. `src/components/drive/FileViewerModal.tsx`
- DialogContent: trocar `max-w-6xl w-[95vw] h-[90vh]` por **tela cheia** (`w-screen h-screen max-w-none rounded-none`) + remover padding extra.
- Extender `ViewerFile` com `lancado?: boolean`.
- Aceitar props opcionais: `onToggleLancado?: (id: string, novoValor: boolean) => void` e `togglingLancadoId?: string | null`.
- No header, quando `onToggleLancado` for fornecido, renderizar botão:
  - Se `current.lancado === false`: botão `outline` "Marcar como lançado" (ícone `CheckCircle2`).
  - Se `current.lancado === true`: botão `default` verde "Lançado ✓" (clicável para reverter).
- Botão não aparece quando o viewer for usado pelo Drive público (sem callback) — preserva compatibilidade.

### 3. `src/components/drive/viewers/PdfViewer.tsx`
- Habilitar camada de texto: `renderTextLayer={true}` (manter `renderAnnotationLayer={false}`).
- Adicionar classe `select-text` ao container para garantir seleção habilitada.
- Os imports de CSS de TextLayer já existem no arquivo — só precisam ser efetivados.

### 4. `src/components/declaracoes/DocumentosDeclaracaoModal.tsx`
- Estender `DocItem` com `lancado: boolean`.
- Incluir `lancado` no `.select(...)` da query.
- `viewerFiles` passa a incluir `lancado` por arquivo.
- Nova mutation `toggleLancado` que faz `update` em `checklist_documentos` setando `lancado`, `lancado_em` e `lancado_por`. Invalida `documentos-declaracao`, `declaracao-aba-docs` e `declaracao-checklist`.
- Passar `onToggleLancado` e `togglingLancadoId` para `<FileViewerModal>`.
- `renderDoc`: quando `d.lancado === true`:
  - Card recebe classes `border-success/40 bg-success/5` (tokens semânticos).
  - Antes do nome aparece ícone `CheckCircle2` verde com `<Tooltip>` "Documento lançado".
  - Ícone do arquivo (FileText) muda de bg-primary/10 para bg-success/10.

### 5. `src/components/declaracao/AbaDocumentosUnificada.tsx`
Mesmas alterações da seção 4 (mesma listagem aparece na aba Documentos da página `/declaracoes/:id`):
- Incluir `lancado` na query e em `ViewerFile`.
- Mesma mutation toggle + invalidate.
- Mesmo tratamento visual (card verde + ícone + tooltip).
- Passar callback para `<FileViewerModal>`.

### 6. Drive e SecaoAnaliseCaixa
Não passam `onToggleLancado` → comportamento atual preservado, viewer fica em tela cheia para todos (melhoria global pedida pelo contador), mas sem botão de "marcar como lançado" (apenas faz sentido no fluxo da declaração).

---

## Resumo técnico de segurança/otimização

- **Segurança**: update protegido pela RLS já existente (somente usuários do mesmo `escritorio_id` via `get_user_escritorio_id()`). Cliente do portal continua sem permissão de marcar como lançado (policy de cliente é para o próprio checklist, mas o botão só é renderizado quando o componente recebe o callback — usado só nas telas do contador).
- **Otimização**: 1 índice parcial; mutation faz apenas `update` mínimo; invalidação restrita às queries impactadas (sem refetch global).
- **Não-regressão**: nenhuma alteração em `status`, triggers, kanban, fluxo de upload, sync com Drive, ou comportamento do viewer no Drive público (somente ganha tela cheia + seleção de texto).

---

## Diagrama

```text
checklist_documentos
  + lancado boolean default false
  + lancado_em timestamptz
  + lancado_por uuid

FileViewerModal (tela cheia + select-text PDF)
  └─ botão "Marcar como lançado" (somente quando onToggleLancado é passado)
       └─ chama mutation no Modal/Aba → update checklist_documentos
            └─ invalidate queries → card fica verde + tooltip "Documento lançado"
```
