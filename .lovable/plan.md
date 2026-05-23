## Diagnóstico da auditoria

Encontrei divergência real entre o status gravado em `declaracoes.status` e os sinais operacionais da própria declaração.

### Divergências confirmadas no banco

- Total de declarações: **54**
- Declarações com status `declaracao_pronta`, mas com sinais claros de transmissão: **5**
- Declarações com status `transmitida`, mas sem recibo/dados de transmissão: **1**

As 5 divergências principais são todas de 2026, no escritório **AGS CONTABILIDADE INTEGRADA LTDA**:

- Jena Junior da Costa
- Andreia Lourenço da Costa
- Juliana Sabrina dos Santos
- Pascoal Angelo Roteli
- Cassia Cristina Iadask de Oliveira

Todas essas 5 têm:

- declaração anexada
- recibo anexado
- `recibo_validado_em` preenchido
- `numero_recibo` preenchido
- `data_transmissao` preenchida
- `declaracao_enviada_em` preenchido
- mas `status = declaracao_pronta`

Portanto, deveriam aparecer como **Transmitida** tanto no Dashboard/Kanban quanto em `/declaracoes`.

## Causa provável

A divergência está no fluxo de anexar PDFs via `processar-pdf-declaracao`.

O comportamento atual é:

1. Quando o recibo é validado, a função muda o status para `transmitida`.
2. Se depois a declaração PDF é anexada/validada, a função ainda pode voltar o status para `declaracao_pronta` quando o status anterior era `aguardando_documentos` ou `documentacao_recebida`.
3. Em alguns casos, por concorrência/ordem de processamento, o recibo marca como `transmitida` e logo depois a validação da declaração sobrescreve para `declaracao_pronta`.

A trilha de atividades confirma exatamente isso: existem eventos “Status alterado de aguardando_documentos para transmitida” seguidos logo depois por “Status alterado de transmitida para declaracao_pronta”.

## Por que Dashboard e /declaracoes divergem da realidade

As duas telas estão lendo o mesmo campo `declaracoes.status`:

- Dashboard/Kanban: `src/hooks/useDashboardData.ts`
- `/declaracoes`: `src/pages/Declaracoes.tsx`

Então o problema não é visual nem filtro. As telas estão sincronizadas entre si, mas estão sincronizadas com um status gravado incorretamente.

## Plano de correção

### 1. Corrigir imediatamente os registros divergentes

Atualizar no banco apenas as declarações que têm evidência objetiva de transmissão, mas ainda estão com status diferente de `transmitida`.

Critério seguro:

```text
status != transmitida
E pelo menos um sinal forte de transmissão:
- recibo_validado_em preenchido
- arquivo_recibo_url preenchido
- numero_recibo preenchido
- data_transmissao preenchida
- declaracao_enviada_em preenchido
```

Para este caso atual, isso corrige as 5 declarações listadas.

### 2. Corrigir a função de processamento de PDFs

Alterar `supabase/functions/processar-pdf-declaracao/index.ts` para impedir regressão automática de status.

Regra proposta:

```text
Se a declaração já tem recibo validado, número de recibo, data de transmissão ou status transmitida,
nunca permitir que o anexo da declaração PDF volte o status para declaracao_pronta.
```

Na prática:

- upload de `recibo` continua marcando como `transmitida`
- upload de `declaracao` só marca como `declaracao_pronta` se não houver nenhum sinal de transmissão
- upload de `darf` e `mei` não altera status principal

### 3. Fortalecer o Kanban contra regressões manuais acidentais

Hoje o Kanban permite arrastar qualquer card para qualquer coluna. Isso pode permitir regressão de `transmitida` para status anterior.

Vou ajustar o handler do Kanban para bloquear regressão quando houver sinal de transmissão, mantendo a regra do sistema:

```text
Declaração com recibo/dados de transmissão não pode voltar para status anterior pelo Kanban.
```

Para isso, o Dashboard precisará carregar sinais mínimos (`recibo_validado_em`, `numero_recibo`, `data_transmissao`, `arquivo_recibo_url`, `declaracao_enviada_em`) junto com cada item.

### 4. Ajustar o detalhe da declaração para evitar regressão insegura

Em `/declaracoes/:id`, o menu “Mover status” também pode permitir regressão dependendo do papel.

Vou bloquear a regressão para declarações já transmitidas por evidência objetiva. O status só poderá avançar ou permanecer coerente com o recibo.

### 5. Revalidar consultas e contadores

Depois das correções:

- reconsultar divergências no banco
- confirmar que as 5 passam a `transmitida`
- confirmar que Dashboard/Kanban e `/declaracoes` continuam lendo do mesmo campo
- confirmar que os KPIs deixam de contar essas declarações como “em andamento”

## Observação importante

Existe também 1 declaração com `status = transmitida`, mas sem recibo/dados de transmissão. Ela parece ser de teste (`cliente teste`, escritório `contCorr`). Eu não corrigiria automaticamente para trás sem confirmação, porque pode ter sido marcada manualmente como transmitida. Posso apenas reportar essa inconsistência ou tratá-la separadamente se você quiser.