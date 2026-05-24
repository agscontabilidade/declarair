## Problema

No upload da aba "Declaração (PDF)" em `/declaracoes`, a IA rejeita arquivos da **Declaração de Saída Definitiva do País (DSDP)** porque o validador (`supabase/functions/processar-pdf-declaracao/index.ts`) só aceita explicitamente a DIRPF (Declaração de Ajuste Anual). O prompt diz: *"true somente se for de fato uma Declaração de Ajuste Anual do IRPF (DIRPF)"* — então a IA marca `eh_declaracao_irpf: false` e o upload é bloqueado com "PDF não reconhecido como Declaração do IRPF".

Saída Definitiva também é uma obrigação acessória do IRPF entregue via programa da Receita (DSDP) e deve ser aceita como "Declaração" para o fluxo do escritório.

## Mudanças

Apenas no edge function `supabase/functions/processar-pdf-declaracao/index.ts`, no ramo `tipo === "declaracao"`:

1. **Ampliar `promptDeclaracao.eh_declaracao_irpf`** para aceitar tanto a DIRPF quanto a **Declaração de Saída Definitiva do País (DSDP)** e a **Comunicação de Saída Definitiva do País** (quando o contador anexa o documento de saída no lugar da DIRPF). Manter rejeição rigorosa para outros documentos (recibo, DARF, extratos, etc.).

2. **Adicionar campo `subtipo`** ao schema da extração: `'dirpf' | 'saida_definitiva' | 'comunicacao_saida'`, para o backend saber qual variante foi reconhecida e logar/armazenar em `declaracao_extracao`.

3. **Ajustar `tipo_resultado` para saída definitiva**: na DSDP normalmente não há "Saldo de Imposto a Pagar"/"Imposto a Restituir" no mesmo formato. Instruir a IA a retornar `'nenhum'` com `valor_resultado: 0` quando for saída definitiva e não houver imposto apurado, e a usar `pagamento`/`restituicao` apenas se o próprio documento trouxer esses valores.

4. **Atualizar `userPromptMap.declaracao`** para mencionar explicitamente: "Aceite tanto a DIRPF (Declaração de Ajuste Anual) quanto a Declaração de Saída Definitiva do País (DSDP) e a Comunicação de Saída Definitiva. Para DSDP, se não houver folha de Resumo com imposto a pagar/restituir, retorne `nenhum` e `valor_resultado: 0`."

5. **Validação de ano**: manter a regra atual (`anoArquivo === anoBase`). DSDP usa ano-exercício no mesmo formato da DIRPF, então não precisa de exceção. Se durante testes aparecer divergência (ex.: DSDP usa ano-calendário), tratamos depois.

## Fora do escopo

- Não mexer no frontend (`AnexarDeclaracaoButton.tsx`), texto do botão continua "Declaração (PDF)".
- Não criar tipo novo no banco (nenhuma migration); a DSDP entra no mesmo slot `arquivo_declaracao_*`.
- Não alterar fluxos de recibo, MEI ou DARF.

## Verificação

- Reler o diff do edge function.
- Pedir ao usuário para testar o upload de uma DSDP real e, se possível, compartilhar o `motivo_rejeicao` retornado caso ainda falhe — assim ajustamos o prompt com base no texto que aparece no PDF.