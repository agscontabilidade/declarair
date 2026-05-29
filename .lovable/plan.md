# Diagnóstico

Não, **não está correto**. A declaração da Ivonete Fatima Felizardo Caetano (2026) deveria estar com status **Transmitida** — e não "Declaração Pronta".

## O que aconteceu (linha do tempo no banco)

A declaração `d03f7666` tem todos os marcadores de transmissão preenchidos:
- `recibo_validado_em` = 28/05 20:40:50
- `numero_recibo` = 03.20.38.45.25-39
- `data_transmissao` = 28/05/2026
- `declaracao_validada_em` = 28/05 20:41:00

E o histórico de `declaracao_atividades` mostra:

```text
20:40:51.042  status: documentacao_recebida → transmitida     (recibo terminou)
20:40:51.098  status: transmitida → declaracao_pronta         (REGRESSÃO ~56ms depois)
20:40:52.36   "Recibo validado automaticamente (nº ...)"
20:40:52.41   "Declaração validada automaticamente via IA"   (1ª passada)
20:41:01.35   "Declaração validada automaticamente via IA"   (2ª passada)
```

## Causa raiz: race condition no `processar-pdf-declaracao`

A usuária subiu **recibo e declaração quase ao mesmo tempo**. As duas chamadas da edge function rodaram em paralelo:

1. A do **recibo** terminou primeiro e mudou status para `transmitida`.
2. A da **declaração**, ~50ms depois, leu o estado "fresco" do banco (`decFresh` em `supabase/functions/processar-pdf-declaracao/index.ts:327-331`) **antes do commit do recibo ficar visível** (READ COMMITTED). Para ela, `status` ainda era `documentacao_recebida` e `recibo_validado_em` era `null` — então caiu no `if` da linha 348 e regrediu o status para `declaracao_pronta`.

O guard de re-leitura existe, mas só protege contra leituras stale do snapshot inicial, não contra transações concorrentes que ainda não commitaram.

# Plano

## 1. Corrigir a edge function (eliminar o race)

`supabase/functions/processar-pdf-declaracao/index.ts` — quando `tipo === "declaracao"`:

- **Não incluir `status` no objeto `updates` quando há risco de regressão.**
- Trocar por um **UPDATE condicional** separado, executado **após** o update de campos:
  ```sql
  UPDATE declaracoes
  SET status = 'declaracao_pronta',
      ultima_atualizacao_status = now()
  WHERE id = $1
    AND status IN ('aguardando_documentos','documentacao_recebida')
    AND recibo_validado_em IS NULL
    AND arquivo_recibo_url IS NULL
    AND numero_recibo IS NULL
    AND data_transmissao IS NULL
  ```
  Assim, se outra transação já marcou `transmitida` (ou populou qualquer marcador de recibo) entre o SELECT e o UPDATE, a cláusula WHERE não casa e o status fica preservado.

- Manter `virouTransmitida` para o caso `tipo === "recibo"` como está.

Nenhuma mudança em RLS, schema ou grants. Sem custo extra.

## 2. Corrigir o registro atual da Ivonete

Migration única (data fix, não-schema):
```sql
UPDATE public.declaracoes
SET status = 'transmitida',
    ultima_atualizacao_status = now()
WHERE id = 'd03f7666-ecde-439d-a7ba-713f70ad70f3'
  AND status = 'declaracao_pronta'
  AND recibo_validado_em IS NOT NULL
  AND numero_recibo IS NOT NULL;
```

(Posso varrer também outras declarações que tenham `recibo_validado_em IS NOT NULL` mas `status <> 'transmitida'` e mostrar o resultado antes de aplicar — opcional, me avise.)

## Fora de escopo
- Schema, RLS, grants, triggers: sem alterações.
- UI: nenhuma mudança visual.
- Lógica de upload no frontend: inalterada.

## Validação
- Após o fix, simular cenário: já existe o caso real da Ivonete — depois do data-fix o card deve aparecer como **Transmitida** no Kanban e na lista.
- Para o race, confirmar lendo o `declaracao_atividades` em próximos uploads paralelos: não deve mais aparecer `transmitida → declaracao_pronta`.
