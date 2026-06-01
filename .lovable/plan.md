Trocar "processada sem erros" por "processada com sucesso" na mensagem padrão do modal de comprovação e no template de e-mail correspondente, mantendo consistência entre UI e e-mail enviado.

## Arquivos alterados

1. `src/components/declaracoes/ComprovacaoProcessamentoModal.tsx` (linha 76)
   - Mensagem padrão pré-preenchida no textarea.

2. `supabase/functions/_shared/transactional-email-templates/processamento-receita-confirmado.tsx`
   - Linha 40: Preview do e-mail ("Declaração processada com sucesso").
   - Linha 56: Corpo padrão do e-mail (quando o contador não customiza).
   - Linha 112: `previewData` usado no preview da Cloud.

## Fora de escopo

- Nenhuma mudança de lógica, schema ou fluxo. Apenas texto.
- Não altero o título "Comprovação de processamento" nem o botão "Confirmar processamento".

## Deploy

- Após editar o template, redeploy do `send-transactional-email` para refletir a mudança nos envios.