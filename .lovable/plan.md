## Objetivo

1. Melhorar responsividade da tabela em `/declaracoes` (colunas Status, Ver documentos, Anexar declaração e Processamento se quebrando em telas menores).
2. Garantir que **todo arquivo enviado** — pelo cliente OU pelo contador (declaração + recibo) — apareça:
   - No **Drive** (`/drive`).
   - No modal **"Ver documentos"** da coluna correspondente em `/declaracoes`.

## Diagnóstico atual

- O modal `DocumentosDeclaracaoModal` e a página `Drive` leem APENAS de `checklist_documentos` filtrando por `arquivo_url not null`.
- Quando o contador anexa via `AnexarDeclaracaoButton`, o PDF é salvo no bucket `documentos-clientes` em `{escritorioId}/declaracoes/{declaracaoId}/{tipo}-...pdf` e o caminho é gravado nas colunas `arquivo_declaracao_url` / `arquivo_recibo_url` da tabela `declaracoes` — **nunca entra em `checklist_documentos`**, por isso some do Drive e do modal.
- A tabela em `/declaracoes` usa `overflow-x-auto` mas sem larguras mínimas otimizadas e sem versão em cards para telas estreitas, fazendo as colunas estourarem (conforme print).

## Plano

### 1. Unificar documentos do contador no checklist
Estratégia: continuar com upload no bucket `documentos-clientes` no mesmo path, **mas** registrar/atualizar uma linha em `checklist_documentos` para cada arquivo do contador.

- Editar a Edge Function `processar-pdf-declaracao` (após validar com sucesso) para fazer um `upsert` em `checklist_documentos` com:
  - `declaracao_id` = atual
  - `categoria` = `'contador'`
  - `nome_documento` = `'Declaração IRPF (PDF)'` ou `'Recibo da Receita (PDF)'`
  - `arquivo_url` = mesmo path do storage
  - `arquivo_nome` = nome original
  - `status` = `'recebido'`
  - `data_recebimento` = `now()`
  - `obrigatorio` = `false`
  - chave de unicidade lógica: combinação (`declaracao_id`, `categoria`, `nome_documento`) — ao substituir um arquivo, a mesma linha é atualizada.
- Quando o contador **substitui** o arquivo, o upsert sobrescreve `arquivo_url`/`arquivo_nome`/`data_recebimento`.

Isto faz com que o Drive e o modal exibam automaticamente esses arquivos sem outras mudanças de leitura — o Drive já agrupa por `categoria`, então surgirá uma pasta **"Contador"** dentro do cliente.

### 2. Garantir cobertura para uploads antigos
Migration única (idempotente) para popular `checklist_documentos` a partir de `declaracoes` que já têm `arquivo_declaracao_url` ou `arquivo_recibo_url` mas ainda não têm a linha equivalente em `checklist_documentos`. Roda uma vez, retroativo.

### 3. Modal "Ver documentos" — exibir tudo
Sem alteração de query: como o passo 1 popula `checklist_documentos`, o modal já mostra automaticamente. Adicionaremos apenas:
- Um agrupamento visual leve por categoria (`Cliente` vs `Contador`) com cabeçalho de seção.
- Atualizar o título para "Documentos da declaração" e descrição para "Arquivos enviados pelo cliente e pelo contador".

### 4. Responsividade da lista `/declaracoes`

**Abordagem:** manter tabela em desktop (≥ lg) e renderizar lista em **cards** abaixo de `lg` (≤1024px), evitando quebra horizontal.

- Wrap atual da `Table` com `hidden lg:block`.
- Adicionar bloco `lg:hidden` com cards: cada declaração vira um card empilhado contendo:
  - Topo: Nome + CPF mascarado + Badge de Status.
  - Meta: Última atualização + Resultado (badge + valor).
  - Ações em grid 2 colunas: `Documentos`, `Observações` (badge ou botão), `Anexar declaração`, `Processamento`.
- Em desktop, ajustar a tabela:
  - `min-w-[1100px]` no `Table` para forçar scroll horizontal apenas se realmente faltar espaço, evitando colunas comprimidas.
  - `whitespace-nowrap` nas colunas de ações.
  - Botões de ação com ícone-only quando `lg`–`xl` (texto reaparece em `xl+`) usando classes responsivas (`hidden xl:inline`).

### 5. Detalhes técnicos

- Path do upload do contador permanece em `{escritorioId}/declaracoes/{declaracaoId}/...` — não muda RLS nem políticas de storage.
- A query do Drive filtra por `declaracoes.escritorio_id = escritorioId`; como `checklist_documentos` está ligado à `declaracao_id`, a mesma RLS continua valendo.
- Categoria `'contador'` é nova; o Drive mostra `capitalize` então aparecerá como **"Contador"**.
- Nenhuma mudança em `src/integrations/supabase/client.ts` ou `types.ts`.

### Arquivos afetados

- `supabase/functions/processar-pdf-declaracao/index.ts` — após validar, upsert em `checklist_documentos`.
- Migration SQL — backfill de declarações já anexadas.
- `src/pages/Declaracoes.tsx` — versão responsiva (table desktop + cards mobile/tablet).
- `src/components/declaracoes/DocumentosDeclaracaoModal.tsx` — agrupar por categoria com cabeçalhos "Cliente" / "Contador" e atualizar título.
- (Opcional) `src/pages/Drive.tsx` — apenas tradução de label "contador" → "Contador (declaração e recibo)" para clareza.

### Fora de escopo
- Não migrar arquivos antigos para outra estrutura de storage.
- Não alterar fluxo de validação por IA dos PDFs.
