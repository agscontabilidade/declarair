O problema real é que o pipeline está tratando “não encontrei o resultado” como “resultado nenhum”. Nos logs, a declaração ANDRIA foi aceita via OCR parcial com `resultado=nenhum valor=0`, porque o OCR.space devolveu só as 3 primeiras páginas e o parser validou CPF/ano/documento, mesmo sem evidência explícita de `IMPOSTO A RESTITUIR` ou `SALDO DE IMPOSTO A PAGAR`.

Do I know what the issue is? Sim: a extração de declaração está permitindo falso positivo quando o bloco/linhas de resultado não aparecem no texto disponível.

## Plano seguro

1. **Não aceitar mais “nenhum/0” sem evidência explícita**
   - Em `extract-native.ts`, ajustar `extractResultadoFromResumo` para diferenciar:
     - resultado encontrado com restituição/pagamento;
     - resultado encontrado explicitamente zerado;
     - resultado ausente/inconclusivo.
   - Se as linhas de resultado não aparecerem, retornar falha controlada em vez de salvar `nenhum`.

2. **Preservar a lógica principal do sistema**
   - Manter o fluxo atual: upload → validação → atualização de `declaracoes` → espelho no checklist → auditoria.
   - Não mexer em tabelas, RLS, status, autenticação ou frontend.
   - Só alterar a decisão de aceitar/rejeitar a extração automática do resultado.

3. **Corrigir a cascata para declarações parcialmente OCRizadas**
   - Em `index.ts`, quando o OCR for parcial e não trouxer resultado confiável, não salvar `nenhum`.
   - Tentar fallback seguro com texto nativo quando houver chance de texto real no PDF.
   - Se ainda não houver bloco de resultado, mandar para IA apenas com o texto disponível; se a IA não validar com evidência, exigir revisão manual em vez de gravar dado errado.

4. **Melhorar o parser do RESUMO sem ampliar escopo**
   - Aceitar variações comuns de OCR/Receita:
     - `IMPOSTO A RESTITUIR`
     - `SALDO DE IMPOSTO A PAGAR`
     - `IMPOSTO A PAGAR`
     - quebras de linha entre label e valor
     - valores zerados `0,00`
   - Considerar `nenhum` válido somente se encontrar explicitamente os dois resultados zerados ou estrutura equivalente.

5. **Logs de produção para não ficarmos cegos**
   - Logar se o resultado foi:
     - encontrado;
     - ausente;
     - zerado explicitamente;
     - bloqueado por OCR parcial.
   - Isso permitirá confirmar no próximo upload sem alterar UI.

6. **Deploy e validação**
   - Deploy somente da função `processar-pdf-declaracao`.
   - Validar pelos logs que ANDRIA não será mais salva como `nenhum/0` sem evidência.
   - Resultado esperado: se o PDF/texto contém o valor, salvar restituição/pagamento corretamente; se a página do resultado não está acessível pelo OCR parcial, o sistema abre revisão manual em vez de gravar errado.

## Observação importante

A solução definitiva contra OCR limitado a 3 páginas é usar OCR que leia todas as páginas do PDF. A própria documentação do OCR.space indica limite de 3 páginas no plano Free/PRO comum e 999+ páginas no PRO PDF. Então o ajuste de código evita dados errados imediatamente; para automatizar PDFs longos/escaneados com precisão total, será necessário usar uma chave/endpoint OCR.space PRO PDF ou outro OCR completo.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>