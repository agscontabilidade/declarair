## Objetivo

Na página pública `/cadastro-cliente/:token` (acessada pelo cliente ao clicar no link do convite), a mensagem personalizada que o contador escreve no modal "Gerar Link de Convite" está sendo exibida em dois lugares — no painel esquerdo (sob o "Bem-vindo!") e em um Alert acima do formulário. Essa mensagem foi pensada para WhatsApp/Email (contém variáveis como `{nome}`, `{link}` e tom de conversa), e fica deslocada na landing de cadastro.

A correção é remover essa exibição da página pública, mantendo sempre o texto padrão do sistema. A mensagem personalizada continua sendo usada normalmente como corpo da mensagem ao compartilhar via WhatsApp/Email pelo modal `GerarLinkConvite`.

## Mudança

**Arquivo:** `src/pages/cliente/CadastroCliente.tsx`

1. **Painel esquerdo (linhas 216–224):** remover o condicional `convite.mensagem_personalizada` e deixar apenas o texto padrão:
   > "Complete seu cadastro para iniciar sua declaração de Imposto de Renda."

2. **Acima do formulário (linhas 259–263):** remover o bloco `<Alert>` que renderiza `convite.mensagem_personalizada`.

3. (Opcional, limpeza) Remover o campo `mensagem_personalizada` da interface local do convite, já que não é mais consumido na tela.

## O que NÃO muda

- `convites_cliente.mensagem_personalizada` continua sendo salvo no banco (usado para histórico e para o template padrão "Convite Cliente").
- `GerarLinkConvite.tsx` continua igual — a mensagem personalizada é usada na prévia, no botão "Copiar Mensagem", no compartilhamento via WhatsApp e no Email.
- Não há mudança de schema, RLS, Edge Functions ou outras telas.

## Validação

- Abrir um link de convite gerado com mensagem personalizada → painel esquerdo mostra apenas o texto padrão; nenhum Alert aparece acima do formulário.
- Compartilhar o link via WhatsApp pelo modal → a mensagem personalizada continua aparecendo normalmente no WhatsApp.
