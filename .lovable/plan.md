## Plano: reformulação de /declaracoes (lado contador)

### 1. Filtro de ano
- No `Select` de ano, manter apenas a opção **2026** e definir como default (`useState('2026')`).
- Remover opções 2023, 2024 e 2025.

### 2. Banco de dados (migração)
Adicionar à tabela `declaracoes` os campos necessários para suportar as novas colunas:
- `arquivo_declaracao_url text` — caminho no bucket `documentos-clientes` para o PDF da declaração transmitida.
- `arquivo_declaracao_nome text` — nome original do arquivo.
- `arquivo_declaracao_uploaded_at timestamptz`.
- `em_processamento boolean not null default false` — flag controlada pelo contador para indicar “em processamento” (ex.: aguardando análise da Receita).

Sem alterações em RLS (já cobertas pelas políticas existentes de `declaracoes`). Storage usará o bucket existente `documentos-clientes`, com path `{escritorio_id}/declaracoes/{declaracao_id}/arquivo.pdf`.

### 3. Nova tabela em `/declaracoes`
Reordenar colunas exatamente nesta sequência:

| # | Coluna | Conteúdo |
|---|--------|----------|
| 1 | CPF | `formatCPF` (mascarado como hoje) |
| 2 | Nome | nome do cliente |
| 3 | Status | Badge atual (`STATUS_LABELS` + cores) |
| 4 | Ver documentos | Botão ícone (FolderOpen) → abre `DocumentosDeclaracaoModal` listando `checklist_documentos` da declaração com link/preview de cada arquivo |
| 5 | Observações | Botão ícone (StickyNote) com indicador (ponto) se houver `observacoes_internas` → abre `ObservacoesModal` (textarea editável, salva em `declaracoes.observacoes_internas`) |
| 6 | Última atualização | `formatDate(ultima_atualizacao_status)` |
| 7 | Resultado | Badge colorido conforme `tipo_resultado` (Restituição verde / A pagar âmbar / Sem imposto cinza) + `formatCurrency(valor_resultado)` quando aplicável; “—” se ainda não definido |
| 8 | Anexar declaração | Se `arquivo_declaracao_url` vazio: botão (Upload) que abre input file (PDF) → faz upload no bucket e atualiza a declaração. Se já existir: ícone Download/Eye com tooltip do nome + botão para substituir |
| 9 | Processamento | `Switch` controlado por `em_processamento`; toggle salva direto via mutation (com toast). Quando ligado, mostra Badge “Em processamento” ao lado |

Observações:
- Remover a coluna “Contador” e a coluna “Ano Base” (redundante com filtro fixo 2026).
- Remover a antiga coluna “Ações” / botão olho — a navegação para detalhes passa a ser pelo clique na linha (`onClick` em `<TableRow>` exceto botões/switch, com `stopPropagation` nos controles).
- Manter busca por nome/CPF e filtro de status.

### 4. Componentes novos
- `src/components/declaracoes/DocumentosDeclaracaoModal.tsx` — Dialog que carrega `checklist_documentos` por `declaracao_id`, lista nome/categoria/status e botão para abrir `arquivo_url` (signed URL via storage).
- `src/components/declaracoes/ObservacoesModal.tsx` — Dialog com Textarea + Salvar (mutation update em `declaracoes.observacoes_internas`).
- `src/components/declaracoes/AnexarDeclaracaoButton.tsx` — Encapsula upload (input hidden, validação PDF, max 20MB), grava no bucket `documentos-clientes` no path acima e atualiza colunas `arquivo_declaracao_*`. Mostra estado “anexado” com Download.
- `src/components/declaracoes/ProcessamentoSwitch.tsx` — Switch controlado com mutation otimista.

### 5. Hooks / data
- Atualizar a query principal de `Declaracoes.tsx` para selecionar também: `observacoes_internas, tipo_resultado, valor_resultado, arquivo_declaracao_url, arquivo_declaracao_nome, em_processamento`.
- Invalidar `['declaracoes-lista']` após cada mutation (observações, upload, switch).
- Reaproveitar `formatCurrency` de `@/lib/formatters`.

### 6. UI / Design
- Manter padrão visual atual (Card shadow-sm, Table shadcn, Badges Tailwind).
- Usar ícones lucide: `FolderOpen`, `StickyNote`, `Upload`, `Download`, `Loader2`.
- Linha clicável com `cursor-pointer hover:bg-muted/50`; controles internos com `e.stopPropagation()`.
- Em telas pequenas, manter colunas essenciais (CPF, Nome, Status, Ações) visíveis e ocultar Observações/Resultado/Processamento com `hidden lg:table-cell`.

### Arquivos a criar/editar
- migração SQL nova em `supabase/migrations/`
- editar `src/pages/Declaracoes.tsx`
- criar 4 componentes em `src/components/declaracoes/`
