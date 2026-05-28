## Objetivo
Adicionar labels visíveis acima de cada filtro nas páginas **Clientes** e **Declarações** para que o contador entenda imediatamente o que cada select filtra (hoje aparece só o valor atual, ex: "Nome (A → Z)", "Todas...", sem contexto).

## Mudanças

### 1. `src/components/clientes/ClientesFilters.tsx`
Envolver cada `Select` num bloco vertical com um `<Label>` pequeno acima:
- "Ordenar por" → select de ordenação
- "Cobrança" → select de cobrança
- "Procuração e-CAC" → select de procuração

Layout: `flex flex-col gap-1` por filtro, mantendo o `flex-wrap` no container externo. Label em `text-xs font-medium text-muted-foreground`. Botão "Limpar" alinhado à base.

### 2. `src/pages/Declaracoes.tsx` (linhas ~295-350, barra de filtros)
Mesmo padrão de label acima:
- "Ano-base" → select de ano
- "Status" → select de status
- "Resultado" → select de resultado
- "Processo (RFB)" → select de processo
- "Arquivos" → select de declaração/recibo
- "Buscar" → input de busca

Manter larguras e ícones atuais dentro do trigger; só adiciono o label acima.

### 3. (Opcional, mesma melhoria) `src/components/dashboard/DashboardFilters.tsx`
Aplicar o mesmo tratamento de labels para os selects de contador / status / ordenação na Row 2, para manter consistência visual em todas as páginas com filtros.

## Detalhes técnicos
- Usar `<Label>` de `@/components/ui/label` com classe `text-xs font-medium text-muted-foreground`.
- Não alterar lógica de filtragem, estado, hooks ou tipos — apenas markup/estrutura.
- Sem mudanças de banco, RLS ou comportamento.

## Critérios de aceite
- Cada filtro nas páginas Clientes, Declarações e Dashboard exibe um rótulo curto acima.
- Larguras, ícones e comportamento dos selects permanecem iguais.
- Em viewport menor, os filtros continuam quebrando linha (flex-wrap preservado).

Confirma se inclui o Dashboard ou prefere limitar a Clientes + Declarações?