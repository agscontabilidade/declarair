## Contexto

A página `/declaracoes/:id` precisa ser reorganizada para refletir o fluxo correto do contador, e há inconsistências entre o nome exibido no Kanban/cabeçalho e o cliente real da declaração.

## Investigação do nome incorreto (Adriana × Luana)

Consulta direta no banco: a única declaração transmitida de 2026 (CPF `292.***.***-40`) pertence ao cliente **Luana de Melo Oliveira**. Não existe nenhum cliente "Adriana Persico Carneiro dos Santos" cadastrado em nenhum escritório. O código (`KanbanCard`, `DeclaracaoHeader`, `useDashboardData`) busca o nome diretamente via `clientes(nome, cpf)` pelo FK — não há override em lugar nenhum.

Hipóteses possíveis:
- Cache antigo do React Query / browser
- Dado alterado/renomeado depois da captura
- Captura veio de um ambiente diferente (preview vs produção)

**Ação:** Após o ajuste das abas, vamos invalidar caches relevantes na invalidação de mutações e adicionar `staleTime` curto na query do detalhe. Se o problema persistir após reload duro, vamos pedir ao usuário o `id` da declaração para inspeção pontual.

## Mudanças de UI/UX em `/declaracoes/:id`

### 1. Aba "Documentos" — unificar com o Drive
Hoje usa o `<AbaDocumentos>` (checklist grande). Vamos substituir pela mesma listagem do `DocumentosDeclaracaoModal` (que já agrupa "Enviados pelo cliente" / "Anexados pelo contador" e usa o `FileViewerModal`), mantendo o checklist como seção secundária colapsável (para o contador ainda saber o que falta). Assim a aba mostra os mesmos arquivos do Drive (declaração, recibo, comprovantes do cliente) e abre tudo dentro do sistema.

### 2. Renomear "Formulário" → "Informações Cadastrais"
- Título da aba e do card.
- Conteúdo: ler de `formulario_ir` + `clientes` (mesmos dados que o cliente preenche em `/cliente/formulario`).
- Sincronização: já é a mesma fonte (`formulario_ir`), basta exibir todos os campos pessoais (nome, CPF, data nascimento, estado civil, endereço, contato, dependentes, chave PIX, perfil fiscal).
- Reorganizar o `SecaoFormularioIR` para focar nos dados cadastrais (esconder seções de rendimentos/bens, que ficam no formulário detalhado da declaração — opcional manter em accordion separado "Dados da declaração").

### 3. Aba "Resultado" — incluir status de processamento RFB
Hoje mostra tipo_resultado, valor, número do recibo. Adicionar:
- Bloco "Processamento na Receita" usando o componente `ProcessamentoSwitch` (já existe em `src/components/declaracoes/ProcessamentoSwitch.tsx`) — mostra `em_processamento` e `status_processamento_rfb` (na fila / processada / malha / etc.).
- Quando o contador alterar o status no switch, o resultado atualiza em tempo real para o cliente também.

### 4. Renomear "IA Fiscal" → "Análise de Caixa"
- Trocar título da aba e do card no `SecaoIAFiscal`.
- Adicionar área de upload do PDF da declaração **exclusiva desta aba** (não vai para o Drive, não cria registro em `checklist_documentos`):
  - Subir para Storage em `documentos-clientes/{escritorio_id}/{cliente_id}/_analise_caixa/{declaracao_id}.pdf` (path com prefixo `_` para distinguir e garantir que não apareça em filtros do Drive).
  - Salvar o caminho em uma nova coluna `declaracoes.arquivo_analise_caixa_url` (migração).
  - Garantir que o Drive (`src/pages/Drive.tsx`) e o `DocumentosDeclaracaoModal` ignorem qualquer path que contenha `/_analise_caixa/`.
- Ajustar `supabase/functions/ia-fiscal/index.ts` para baixar esse PDF e injetar como contexto na chamada do Lovable AI Gateway, focando o prompt em **estouro de caixa, evolução patrimonial e divergências entre rendimentos × bens**.
- Botões da aba: "Subir Declaração para Análise" + "Executar Análise de Caixa". Se o PDF não foi enviado ainda, desabilita o botão de análise.

### 5. Botão "Enviar Declaração ao Cliente"
Em `DeclaracaoDetalhe.tsx` o botão verde aparece sempre que `status === 'transmitida'`. Mudar a condição para:
```ts
const podeEnviarAoCliente = isTransmitida 
  && !!declaracao.arquivo_declaracao_url 
  && !!declaracao.arquivo_recibo_url
  && !declaracao.declaracao_enviada_em;
```
Adicionar coluna `declaracoes.declaracao_enviada_em` (migração) marcada quando o `EnviarDeclaracaoModal` for confirmado, para esconder o botão definitivamente após o envio.

## Mudanças no banco (migração SQL)

```sql
ALTER TABLE public.declaracoes
  ADD COLUMN IF NOT EXISTS arquivo_analise_caixa_url text,
  ADD COLUMN IF NOT EXISTS arquivo_analise_caixa_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS declaracao_enviada_em timestamptz;
```

## Arquivos a editar

- `src/pages/DeclaracaoDetalhe.tsx` — renomear abas, ajustar condição do botão verde, mover layout de documentos.
- `src/components/declaracao/SecaoFormularioIR.tsx` → renomear conteúdo para "Informações Cadastrais" (manter componente, ajustar seções).
- `src/components/declaracao/SecaoResultado.tsx` — embutir `ProcessamentoSwitch`.
- `src/components/declaracao/SecaoIAFiscal.tsx` → renomear para "Análise de Caixa", incluir upload + estado.
- `src/components/declaracao/EnviarDeclaracaoModal.tsx` — após sucesso, salvar `declaracao_enviada_em`.
- `src/components/cliente-perfil/AbaDocumentos.tsx` ou novo `AbaDocumentosDeclaracao.tsx` — variante que usa a listagem unificada do modal + checklist colapsado.
- `src/pages/Drive.tsx` — filtrar paths `/_analise_caixa/`.
- `src/components/declaracoes/DocumentosDeclaracaoModal.tsx` — filtrar paths `/_analise_caixa/`.
- `supabase/functions/ia-fiscal/index.ts` — usar PDF de análise de caixa como contexto.
- Nova migração SQL com as 3 colunas.

## Fora do escopo (até confirmação)

- Não vou tocar em renomeações no Kanban (`KanbanCard`) porque o nome vem direto do FK `clientes.nome`. Se após reload duro o nome ainda aparecer errado, abro investigação separada.

Aprovado? Sigo com a implementação.