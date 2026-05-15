## Objetivo
Ajustar a linha da cobrança no texto padrão do e-mail de envio de declaração para ser mais humanizada: **"O valor da declaração é: R$ X.XXX,XX"**, removendo vencimento e status.

## Escopo (estrito)
Alterar APENAS `src/components/declaracoes/EnviarDeclaracaoEmailModal.tsx`.

## Mudanças
- No `useEffect` que monta a mensagem, substituir a linha de cobrança por:
  > "O valor da declaração é: R$ X.XXX,XX"
- Remover o uso de `data_vencimento` e `status` da cobrança — não precisa mais buscar esses campos.
- Se não houver cobrança, não incluir linha nenhuma (comportamento igual ao atual).