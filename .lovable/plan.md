## Adicionar filtros em /declaracoes

A página `/declaracoes` já tem filtros de **Ano Base** e **Status** (da declaração) + busca. Adicionar 3 novos filtros, correspondendo às colunas da tabela.

### Novos filtros

| Filtro | Opções | Campo no banco |
|---|---|---|
| **Resultado** | Todos / Restituição / A pagar / Sem imposto | `tipo_resultado` (restituicao / pagamento / nenhum) |
| **Processo (RFB)** | Todos / Aguardando / Processada / Pendências / Malha Fina | `status_processamento_rfb` |
| **Declaração/Recibo** | Todos / Com arquivos / Sem arquivos / Apenas declaração / Apenas recibo | derivado de `arquivo_declaracao_url` + `arquivo_recibo_url` |

O filtro de "Status da documentação" mencionado já existe (select **Status**) — mantenho como está.

### Arquivo a modificar

**`src/pages/Declaracoes.tsx`** (único arquivo):

1. Adicionar 3 novos `useState`:
   - `resultadoFiltro` (`'todos' | 'restituicao' | 'pagamento' | 'nenhum'`)
   - `processoFiltro` (`'todos' | 'aguardando' | 'processada' | 'pendencias' | 'malha_fina'`)
   - `arquivosFiltro` (`'todos' | 'completo' | 'nenhum' | 'so_declaracao' | 'so_recibo'`)

2. Inserir 3 novos `<Select>` na barra de filtros existente (linha 264), com ícones lucide (`Wallet`, `Activity`, `Paperclip`).

3. Estender o `.filter()` (linha 241) com as novas regras client-side:
   - `tipo_resultado === resultadoFiltro` (tratando `null` para "nenhum" opcional)
   - `status_processamento_rfb === processoFiltro`
   - Lógica de `arquivosFiltro` baseada em `!!arquivo_declaracao_url` e `!!arquivo_recibo_url`

4. Adicionar botão "Limpar filtros" (variant ghost) que aparece quando algum filtro está ativo.

### Sem alterações de backend
Todos os filtros são client-side sobre os dados já trazidos pela query (que já inclui `tipo_resultado`, `status_processamento_rfb`, `arquivo_declaracao_url`, `arquivo_recibo_url`).