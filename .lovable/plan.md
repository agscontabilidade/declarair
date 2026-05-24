## Diagnóstico do caso enviado

O PDF enviado é uma **Declaração de Saída Definitiva do País**, exercício **2026**, ano-calendário **2025**, com texto pesquisável e resultado no resumo:

- CPF detectável: `326.877.918-22`
- Tipo: `DECLARAÇÃO DE SAÍDA DEFINITIVA DO PAÍS`
- Exercício: `2026`
- Resultado: `IMPOSTO A RESTITUIR | 892,31`

O modal está aparecendo porque o pipeline atual depende quase só do `unpdf.extractText()`. Neste arquivo, o parser da plataforma provavelmente está retornando texto insuficiente e classificando como `scan_sem_texto`, mesmo o PDF tendo texto extraível. Ou seja: o problema principal não é falta de IA, é **extrator nativo fraco / sem fallback real de layout**.

## Plano de implementação

### 1. Fortalecer a extração de texto sem IA

Atualizar `supabase/functions/processar-pdf-declaracao/extract-native.ts` para usar uma cadeia determinística de extração:

```text
PDF bytes
  ├─ unpdf.extractText()
  ├─ fallback pdfjs getTextContent() página por página
  ├─ reconstrução de linhas por coordenadas Y/X
  ├─ normalização fiscal PT-BR
  └─ parsers por tipo documental
```

O fallback com `pdfjs getTextContent()` será obrigatório quando:

- `unpdf` retornar menos de 80 caracteres úteis;
- o texto vier sem marcadores fiscais esperados;
- o PDF tiver muitas quebras de layout/tabelas;
- for declaração de saída definitiva, recibo ou DARF com valores em colunas.

### 2. Parser específico para Declaração de Saída Definitiva

Criar regras específicas para `saida_definitiva`, sem tratar como DIRPF genérica:

Campos obrigatórios:

- `DECLARAÇÃO DE SAÍDA DEFINITIVA DO PAÍS`
- `IMPOSTO SOBRE A RENDA - PESSOA FÍSICA`
- CPF válido por dígito verificador
- Exercício compatível com `ano_base`
- Ano-calendário compatível, quando presente

Campos extraídos:

- CPF
- Nome
- Exercício
- Ano-calendário
- País de destino, quando existir
- Data de caracterização da condição de não residente, quando existir
- Resultado financeiro no resumo:
  - `SALDO DE IMPOSTO A PAGAR`
  - `IMPOSTO A RESTITUIR`
  - `Valor da quota`

Regra para o PDF enviado:

```text
SALDO DE IMPOSTO A PAGAR = 0,00
IMPOSTO A RESTITUIR = 892,31
=> tipo_resultado = restituicao
=> valor_resultado = 892.31
```

### 3. Melhorar leitura de resultado financeiro em qualquer declaração

Hoje a leitura depende de regex simples em texto corrido. Vou trocar por um resolvedor fiscal mais tolerante:

```text
1. localizar página/trecho RESUMO
2. procurar labels financeiras normalizadas
3. ler valor na mesma linha
4. se não houver, ler valor imediatamente abaixo
5. comparar pagar x restituir
6. aplicar regra de decisão:
   - pagar > 0 => pagamento
   - restituir > 0 => restituicao
   - ambos zero => nenhum
   - ambos > 0 => rejeição por inconsistência
```

Isso cobre PDFs onde o valor aparece como:

- `IMPOSTO A RESTITUIR | 892,31`
- `IMPOSTO A RESTITUIR 892,31`
- label em uma linha e valor na linha seguinte
- tabela extraída fora de ordem

### 4. Reclassificar corretamente “scan_sem_texto”

Depois do fallback `pdfjs`, só classificar como `scan_sem_texto` quando **todos** os extratores retornarem texto insuficiente.

Novo fluxo:

```text
unpdf falhou ou retornou pouco texto
  ↓
pdfjs getTextContent por página
  ↓
se texto útil >= limite: continuar validação normal
  ↓
se texto útil ainda baixo: scan_sem_texto real
```

Esse PDF enviado não deve mais cair no modal.

### 5. Scoring mais rígido, mas sem falso negativo nesse padrão

Substituir o score genérico por evidências fiscais obrigatórias:

```text
Declaração aceita automaticamente se:
- tipo documental reconhecido
- CPF válido e igual ao cliente
- exercício igual ao ano_base
- Receita Federal / IRPF / DSDP reconhecido
- resultado financeiro resolvido ou subtipo permitir resultado neutro
```

Para dados financeiros, manter regra conservadora:

- se conseguir ler com consistência, grava automaticamente;
- se detectar conflito real, rejeita;
- se o PDF for texto válido mas só o resultado financeiro falhar, registrar arquivo e resultado como `nenhum` apenas quando ambos os campos forem explicitamente zero; caso contrário não inventar valor.

### 6. Ampliar parsers dos outros documentos sem IA

No mesmo arquivo, fortalecer os parsers existentes:

**Recibo RFB**
- leitura de número próximo de `Nº do recibo`, `Recibo de Entrega`, `declaração recebida`
- DV módulo 11 quando formato permitir
- data/hora de transmissão com múltiplos formatos

**DARF**
- código de receita em formatos com ou sem label
- CPF/CNPJ do contribuinte
- período de apuração
- vencimento
- valor principal, multa, juros e total
- whitelist de IRPF PF expandida

**DASN-SIMEI / MEI**
- CNPJ por DV
- CPF do responsável/titular quando presente
- ano-calendário
- número de recibo e data de transmissão quando existirem

### 7. Teste real com o PDF enviado antes de concluir

Após implementar, testar a função com o PDF enviado e confirmar que retorna algo equivalente a:

```json
{
  "ok": true,
  "tipo": "declaracao",
  "extracao": {
    "eh_declaracao_irpf": true,
    "subtipo": "saida_definitiva",
    "cpf": "32687791822",
    "ano_exercicio": 2026,
    "tipo_resultado": "restituicao",
    "valor_resultado": 892.31
  },
  "metodo_validacao": "regex"
}
```

### 8. Não alterar UI e não mexer no banco

Para reduzir risco em produção:

- não alterar schema;
- não mexer em RLS;
- não alterar o modal;
- não alterar fluxo visual;
- alterar apenas o motor de validação determinística e, se necessário, pequenos logs técnicos no backend.

## Resultado esperado

- Esse PDF de saída definitiva será validado automaticamente.
- PDFs textuais da Receita não devem mais cair como `scan_sem_texto` por falha do extrator primário.
- A plataforma continua sem usar IA para validação.
- Dados financeiros serão extraídos por regras determinísticas, com validação cruzada de CPF, ano, tipo documental e consistência dos valores.

## Limite técnico honesto

Para PDF puramente escaneado/imagem, sem camada de texto, a única forma não-IA de leitura automática é OCR determinístico. Posso adicionar OCR depois como segunda etapa, mas para este caso específico não é necessário: o arquivo enviado tem texto e deve ser resolvido com extração nativa robusta.