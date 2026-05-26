# Reativar upload de documentos pelo contador

## Problema
Na refatoração anterior, a aba **Documentos** em `/declaracoes/:id` (e em `/clientes/:id` > Documentos) passou a usar `AbaDocumentosUnificada`, que só **lista** arquivos. O botão que permitia ao contador anexar documentos sumiu. Os contadores precisam voltar a conseguir subir arquivos por ali (ex.: comprovantes, PDFs gerados, etc.).

## Escopo (estrito)
Alterar **apenas** `src/components/declaracao/AbaDocumentosUnificada.tsx` para adicionar um botão de upload do lado do contador. Nada mais é tocado:
- Não mexer no portal do cliente
- Não mexer no hook `useClientePortal`
- Não mexer no `ClientePerfil` nem no `DeclaracaoDetalhe` além do que já está
- Não mexer em RLS, storage policies, ou no schema
- Não recriar checklist/pendências

## Mudança

No header do card `Documentos da declaração`, adicionar botão **"Anexar documento"** (ícone Upload). Comportamento:

1. Abre um `<input type="file" multiple>` invisível (mesmo padrão já usado em outros uploads do app).
2. Para cada arquivo selecionado:
   - `INSERT` em `checklist_documentos` com:
     - `declaracao_id` = prop atual
     - `categoria = 'contador'`
     - `nome_documento` = nome do arquivo (sem extensão)
     - `obrigatorio = false`
     - `status = 'recebido'`
     - `arquivo_nome` = nome do arquivo
     - `data_recebimento = now()`
   - Upload no bucket `documentos-clientes` no path `{escritorio_id}/{cliente_id}/{novoId}/{file.name}` (mesmo padrão do `useDeclaracao.uploadDoc`).
   - `UPDATE` na linha recém-criada com `arquivo_url = path`.
3. Mostrar toast de sucesso/erro e invalidar as queries:
   - `['declaracao-aba-docs', declaracaoId]`
   - `['documentos-declaracao', declaracaoId]`
   - `['declaracao-checklist', declaracaoId]`
4. Para obter `escritorio_id` e `cliente_id`, fazer um pequeno `SELECT` em `declaracoes` (id, escritorio_id, cliente_id) na hora do upload — evita acoplar com `useDeclaracao` e mantém o componente reutilizável tanto em `DeclaracaoDetalhe` quanto em `ClientePerfil`.

## Garantias de não-regressão
- O botão **"Adicionar item"** (que depende da prop opcional `onAddItem`) **continua existindo** exatamente como está — só adicionamos o novo botão ao lado.
- A listagem, agrupamento (cliente/contador), visualizador e download permanecem intactos.
- Arquivos enviados pelo contador aparecem automaticamente no grupo "Anexados pelo contador" porque a categoria é `'contador'`.
- Nenhuma mudança em portal do cliente, contagem de arquivos reais ou status da declaração.

## Arquivos afetados
- `src/components/declaracao/AbaDocumentosUnificada.tsx` (único arquivo modificado)
