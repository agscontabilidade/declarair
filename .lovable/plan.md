## Objetivo
No modal de envio de declaração por e-mail (acionado pelo botão "Enviar" em `/declaracoes`), incluir automaticamente o valor da cobrança vinculada àquela declaração no texto padrão da mensagem.

## Escopo (estrito)
Alterar APENAS `src/components/declaracoes/EnviarDeclaracaoEmailModal.tsx`. Nenhuma outra mudança.

## Mudanças

**`EnviarDeclaracaoEmailModal.tsx`**
1. Ao abrir o modal, buscar em `cobrancas` a cobrança vinculada via `declaracao_id` (filtrando por `escritorio_id` para respeitar RLS), pegando a mais recente não cancelada — campos `valor`, `status`, `data_vencimento`.
2. Atualizar o `useEffect` que monta a `mensagem` padrão para, quando houver cobrança, acrescentar uma linha do tipo:
   > "Valor dos honorários: R$ X.XXX,XX (vencimento DD/MM/AAAA — status: pendente/pago/atrasado)."
   
   Se não houver cobrança vinculada, o texto padrão segue exatamente como hoje (sem linha extra).
3. Formatação: BRL via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`; data via util já existente em `@/lib/formatters` se houver, senão `toLocaleDateString('pt-BR')`.

## Pontos a confirmar antes de implementar
- Se houver mais de uma cobrança ligada à mesma declaração, usar a **mais recente por `created_at`** e ignorar canceladas. (Se preferir somar todas em aberto, me avise.)
- Manter o comportamento de o usuário poder editar livremente o texto antes de enviar.

## O que NÃO será alterado
- `src/pages/Declaracoes.tsx`
- `EnviarDeclaracaoModal.tsx` (modal antigo via chat — não é o usado pelo botão Enviar atual)
- Template de e-mail no backend
- Qualquer lógica de cobranças/RLS