Plano focado para resolver o resultado errado sem quebrar a aplicação:

1. Bloquear gravação quando a visão divergir
- Hoje o Vision lê corretamente `Imposto a Restituir 892,31`, mas é rejeitado porque a validação exige que a linha literal apareça no OCR.
- Depois disso, o código cai no fallback de IA por texto e grava `1.836,56`, que é o erro.
- Vou alterar a cascata de `tipo === "declaracao"` para: se Vision falhar por validação de evidência/linha/valor, não usar mais IA-texto; cair direto em revisão manual. IA-texto só ficará permitido para outros tipos ou falhas técnicas claras.

2. Tornar a validação do Vision compatível com OCR imperfeito
- O OCR junta palavras e pode remover espaços, por isso `impostoarestituir892,31` não bate com a linha citada formatada.
- Vou trocar a checagem rígida de `linha_citada` por uma validação de evidência flexível: label esperado + valor monetário precisam aparecer próximos no OCR compactado, aceitando ruído de espaços/pontuação.
- Isso permitirá aceitar casos como `Imposto a Restituir 892,31` quando o OCR trouxe `impostoarestituir892,31`.

3. Reforçar o parser determinístico do RESUMO
- Vou ajustar `extractResultadoFromResumo` para também capturar valor quando o label e o dinheiro aparecem colados ou em linhas reconstruídas de forma ruim.
- A prioridade seguirá estrita: `IMPOSTO A RESTITUIR` ou `SALDO DE IMPOSTO A PAGAR`, nunca totais, rendimentos, base de cálculo ou imposto devido.

4. Manter o restante intacto
- Não haverá mudança de schema, RLS, storage, UI, email, recibo, MEI ou DARF.
- Só serão editados os arquivos da função `processar-pdf-declaracao` ligados à extração de declaração.

5. Validação após implementar
- Conferir logs da função para garantir que o caso atual não grava mais `1.836,56`.
- Resultado esperado: aceitar `892,31` quando Vision+evidência validarem; se não validar com segurança, não salvar nada errado e pedir revisão manual.