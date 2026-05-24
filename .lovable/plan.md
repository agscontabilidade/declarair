## Diagnóstico

O problema principal não é mais falha de chamada: a função está retornando `200` e a IA aparece como `ok=true`. O gargalo atual é precisão/validação:

- O OCR.space está devolvendo texto parcial por limite de 3 páginas.
- O regex falha porque lê `ano 2025` como se fosse ano-exercício, quando em declaração IRPF 2026 esse `2025` costuma ser ano-calendário.
- Quando o regex falha, a IA consegue extrair algo, mas hoje a validação ainda depende pouco de evidências específicas do bloco `RESUMO`.
- O app atualiza `declaracoes`, mas pode gravar resultado incorreto se a IA escolher um valor que existe no texto fora do campo correto.

## Plano de correção definitiva

### 1. Corrigir interpretação de ano em declaração IRPF

Ajustar o parser para declaração aceitar a relação correta:

- `ano_exercicio` deve bater com `ano_base`.
- `ano_calendario` pode ser `ano_base - 1`.
- Se o OCR só encontrar `2025` perto de “ano-calendário”, isso não deve reprovar uma declaração `2026`.
- A busca de ano deve priorizar labels fortes como `Exercício 2026`, `IRPF 2026`, `Declaração de Ajuste Anual 2026`, e só depois considerar `ano-calendário` como evidência auxiliar.

### 2. Criar extração determinística específica para o bloco RESUMO

Substituir a lógica genérica de “pegar primeiro dinheiro depois do label” por uma extração focada em pares label/valor do resumo:

- Normalizar OCR com quebras ruins, espaços duplicados e acentos.
- Recortar somente a janela `RESUMO` até `INFORMAÇÕES BANCÁRIAS`, `PAGAMENTOS EFETUADOS` ou final da página.
- Procurar explicitamente:
  - `IMPOSTO A RESTITUIR`
  - `SALDO DE IMPOSTO A PAGAR`
  - variações comuns do OCR sem acento ou com quebras de linha.
- Usar validação cruzada: se ambos aparecem positivos, rejeita para revisão/IA; se um aparece positivo e outro zero/ausente, aceita.
- Evitar pegar `rendimentos`, `base de cálculo`, `imposto devido` e `total de deduções` como resultado final.

### 3. Usar OCR como fonte principal para declarações escaneadas, mas sem depender de IA

Manter a cascata para `declaracao` assim:

```text
OCR.space -> parser RESUMO determinístico -> IA somente se RESUMO não fechar -> revisão manual
```

A IA continuará como último recurso para controlar créditos.

### 4. Fortalecer IA com validação por evidência textual

Quando a IA for acionada:

- Enviar preferencialmente só a janela do `RESUMO` + cabeçalho com CPF/nome/ano.
- Exigir que o valor retornado esteja próximo do label correto, não apenas “em qualquer lugar do texto”.
- Rejeitar IA se o valor estiver presente no documento mas associado a outro campo, como rendimentos/base/imposto devido.
- Manter bloqueio de CPF divergente e ano divergente.

### 5. Melhorar logs para auditoria de produção

Adicionar logs compactos com:

- método usado: `ocr-resumo`, `regex`, `ia`, `manual`;
- ano encontrado e contexto (`exercicio` ou `calendario`);
- valores candidatos de restituição/pagamento;
- motivo exato quando cair para IA/manual.

Isso permite diagnosticar documentos problemáticos sem expor dados sensíveis demais.

### 6. Validar com os documentos reais já enviados

Após implementar:

- Reprocessar/testar a função com o último PDF enviado (`ALMVEIDA 2.pdf`) usando o storage path já registrado.
- Conferir no banco se `tipo_resultado`, `valor_resultado`, `declaracao_extracao` e `declaracao_validada_em` foram atualizados corretamente.
- Verificar logs da função para confirmar que a IA só foi usada se o parser determinístico não conseguiu fechar o RESUMO.

## Arquivos envolvidos

- `supabase/functions/processar-pdf-declaracao/extract-native.ts`
- `supabase/functions/processar-pdf-declaracao/ai-fallback.ts`
- `supabase/functions/processar-pdf-declaracao/index.ts`

Sem mudança de schema, RLS, tabelas ou frontend neste ajuste.