## Objetivo
Adicionar botão "Excluir" no `FileViewerModal` (visualizador de documentos do Drive) com diálogo de confirmação, sem quebrar fluxos existentes.

## Escopo (estrito)
- Apenas o visualizador acessado pelo `/drive`. Em outros lugares onde o `FileViewerModal` é usado (ex.: `AbaDocumentosUnificada`, `DocumentosDeclaracaoModal`), o botão **não aparece** — controlado por prop opcional `onDelete`.
- Sem alterações de schema, RLS ou outros componentes além dos listados.

## Comportamento
1. Botão "Excluir" (ícone lixeira, variante destrutiva discreta) no header do `FileViewerModal`, ao lado dos botões existentes, **apenas quando** a prop `onDelete` for fornecida.
2. Ao clicar → abre `AlertDialog` (shadcn) com:
   - Título: "Excluir documento"
   - Descrição: "Tem certeza que deseja excluir **{nome do arquivo}**? Esta ação não pode ser desfeita."
   - Ações: "Cancelar" / "Excluir" (destrutivo).
3. Confirmação → chama `onDelete(currentId)`:
   - Remove o arquivo do bucket `documentos-clientes` (e o sidecar `.ocr.pdf` se existir — best-effort, ignora erro).
   - Faz `update` em `checklist_documentos` zerando `arquivo_url`, `arquivo_nome`, `data_recebimento`, `status='pendente'`, `lancado=false` (mantém o item do checklist para o contador poder receber novamente — preserva fluxos).
   - Invalida queries: `drive-docs`, `documentos-declaracao`, `declaracao-aba-docs`, `declaracao-checklist`.
   - Toast de sucesso/erro.
4. Após excluir, o modal:
   - Se houver próximo arquivo na lista, navega para ele.
   - Se for o último, fecha o modal.
   - Remove o item de `viewerFiles` localmente.

## Arquivos a alterar
- **`src/components/drive/FileViewerModal.tsx`**
  - Nova prop opcional: `onDelete?: (id: string) => Promise<void> | void` e `deletingId?: string | null`.
  - Importar `AlertDialog*` de `@/components/ui/alert-dialog` e ícone `Trash2`.
  - Estado local `confirmOpen`. Botão só renderiza se `onDelete` existir.
  - Loader (`Loader2`) quando `deletingId === current.id`.

- **`src/pages/Drive.tsx`**
  - Nova `useMutation` `deleteDoc`:
    - `supabase.storage.from('documentos-clientes').remove([path, path + '.ocr.pdf'])` (ignora erro do sidecar).
    - `update` em `checklist_documentos` (campos acima) `eq('id', id)`.
    - Em `onSuccess`: invalida queries, remove do `viewerFiles`, navega para próximo ou fecha.
  - Passar `onDelete` e `deletingId` ao `FileViewerModal`.

## Segurança
- RLS de `checklist_documentos` e do bucket já garantem que apenas usuários do escritório podem excluir. Sem mudanças necessárias.

## Não faremos
- Não adicionar exclusão nos modais de declaração (mantém comportamento atual).
- Não excluir o registro do `checklist_documentos` (apenas limpa o arquivo) — preserva o checklist do contador.
- Sem alterações de design system, sem migrações.