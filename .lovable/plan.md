## Mensagem padrão pré-preenchida no modal de aviso de cobrança

### O que muda

**1. `src/components/cobrancas/AvisoCobrancaModal.tsx`**
- Buscar nome e chave Pix do escritório (tabela `escritorios`, via `useAuth().profile.escritorioId`).
- Ao abrir o modal, preencher automaticamente o textarea "Mensagem personalizada":
  - **Individual** (1 cobrança): valores reais do cliente, valor, descrição, vencimento e chave Pix.
  - **Massa**: mesma mensagem porém usando placeholders `{nome}`, `{valor}`, `{descricao}`, `{vencimento}`, `{chave_pix}`, expandidos por destinatário no backend.
- Texto base:
  > Olá {nome}, tudo bem?
  >
  > Passando para lembrar que o honorário no valor de R$ {valor} referente a {descricao} está em aberto (vencimento {vencimento}).
  >
  > Se você já realizou o pagamento, por favor desconsidere este aviso. 🙂
  >
  > Caso ainda não tenha pago, segue nossa chave Pix:
  > 🔑 {chave_pix}
  >
  > Qualquer dúvida, estamos à disposição.
- Se o escritório não tem `chave_pix` cadastrada, omitir o bloco do Pix e mostrar um aviso discreto abaixo do textarea sugerindo cadastrar em Configurações.
- Usuário pode editar/limpar livremente; só pré-popula quando o modal é aberto vazio.

**2. `supabase/functions/enviar-aviso-cobranca/index.ts`**
- Ajustar `applyPlaceholders` para também expandir os placeholders dentro da `mensagemAdicional` antes do replace de `{mensagem_adicional}`. Isso faz o modo massa funcionar com `{nome}`, `{valor}`, `{chave_pix}` etc. variando por destinatário.
- Sem mudança de contrato, sem migração.

### Fora de escopo
- Não alterar o template salvo do escritório (aba "Aviso de Cobrança" em Configurações).
- Não alterar o template React de email (`aviso-cobranca.tsx`).
- Sem mudanças de schema, RLS ou em outras telas.