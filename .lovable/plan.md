## Diagnóstico

O problema ainda acontece por dois motivos combinados:

1. **Existem declarações antigas criadas em 2026 com `ano_base = 2025`**
   - Encontrei 3 declarações nessa situação.
   - Todas estão com status `aguardando_documentos`.
   - 2 delas já têm documentos anexados, totalizando 61 arquivos vinculados ao ano-base 2025.
   - Esses documentos aparecem na pasta 2025 porque o Drive filtra pelo `declaracoes.ano_base`, não pelo caminho físico do arquivo.

2. **O portal do cliente escolhe a declaração ativa por `created_at` mais recente**
   - Em `useClientePortal.ts` e `useFormularioIR.ts`, o sistema busca a última declaração criada do cliente, sem restringir ao ano corrente.
   - Se o cliente só tem uma declaração 2025, ou se a declaração 2025 foi criada depois/continua sendo a última, qualquer novo upload ainda será gravado nela.

A correção feita anteriormente impede novos convites de criarem `ano_base = 2025`, mas não corrige as declarações antigas já existentes nem impede que o portal continue usando uma declaração antiga caso ela exista.

## Plano de correção definitiva

### 1. Centralizar a regra de “ano-base atual” no frontend
Criar uma constante utilitária para o ano-base corrente e substituir valores fixos como `2026`/listas estáticas onde a tela depende do ano atual.

Aplicar em:
- Drive de Documentos
- Declarações
- Nova Declaração
- Dashboard quando aplicável

Objetivo: evitar que o sistema fique preso em anos hardcoded.

### 2. Ajustar o portal do cliente para sempre priorizar o ano corrente
Alterar as consultas do portal do cliente para buscar a declaração ativa nesta ordem:

```text
1. declaração do ano corrente, se existir
2. caso não exista, declaração mais recente por ano_base
3. último fallback por created_at
```

Aplicar em:
- `src/hooks/useClientePortal.ts`
- `src/hooks/useFormularioIR.ts`

Objetivo: impedir que uploads futuros caiam numa declaração antiga quando houver ou vier a existir uma declaração do ano correto.

### 3. Criar proteção automática no upload do cliente
Antes de inserir o arquivo no checklist, validar se a declaração carregada pelo portal é do ano corrente.

Se não for:
- procurar declaração do ano corrente para o mesmo cliente;
- se existir, usar essa declaração;
- se não existir, criar uma declaração do ano corrente e usar ela para o upload.

Aplicar em:
- `src/pages/cliente/ClienteDocumentos.tsx`

Objetivo: mesmo se algum cache, link antigo ou estado de tela apontar para 2025, o upload será redirecionado para a declaração correta.

### 4. Corrigir os dados existentes que ainda estão em 2025
Atualizar as declarações antigas criadas em 2026 com `ano_base = 2025` para `ano_base = 2026`, somente quando forem declarações ainda não transmitidas.

Critério seguro:

```sql
ano_base = 2025
status != 'transmitida'
data_transmissao is null
numero_recibo is null
created_at >= '2026-01-01'
```

Também atualizar o `formulario_ir.ano_base` correspondente, quando existir.

Objetivo: os documentos já enviados por esses clientes deixam de aparecer na pasta 2025 e passam a aparecer na pasta 2026 sem mover arquivos físicos.

### 5. Preservar histórico verdadeiro
Não alterar declarações transmitidas, com recibo, data de transmissão ou histórico real de 2025.

Objetivo: evitar impacto contábil em declarações antigas reais.

### 6. Validação pós-implementação
Depois da mudança:
- consultar o banco para confirmar que não restam declarações 2025 não transmitidas criadas em 2026;
- confirmar que clientes afetados aparecem no Drive 2026;
- revisar as consultas do portal para garantir que o ano corrente é priorizado;
- checar que nenhum fluxo novo cria upload vinculado a ano-base 2025 por padrão.