## Objetivo

No modal `EnviarDeclaracaoEmailModal` (acionado em `/declaracoes` e em `/declaracao/:id`), adicionar um campo opcional onde o contador pode informar um ou mais e-mails que receberão **cópia** da mesma mensagem enviada ao cliente, com os mesmos anexos (Declaração, Recibo e DARF quando houver).

## Escopo (somente frontend)

Sem alterações no banco, RLS ou edge functions. A edge function `send-transactional-email` aceita 1 destinatário por chamada — então o envio para os e-mails em cópia será feito invocando a função **uma vez por destinatário extra**, reaproveitando o mesmo `templateData`, mensagem e `attachmentPaths`. Isso evita mudanças no backend e mantém o fluxo atual estável.

## Mudanças

### 1) `src/components/declaracoes/EnviarDeclaracaoEmailModal.tsx`

- Adicionar estado `emailsCopia: string` (input controlado, texto livre separado por vírgula, ponto-e-vírgula ou espaço).
- Novo campo na UI, abaixo do textarea da mensagem e acima de "Documentos inclusos":
  - `Label`: "Enviar cópia para (opcional)"
  - `Input` com placeholder: `email1@exemplo.com, email2@exemplo.com`
  - Texto auxiliar pequeno: "Separe múltiplos e-mails por vírgula."
- Função utilitária local `parseEmails(raw: string): string[]` que:
  - faz split por `[,;\s]+`
  - faz trim e remove vazios
  - faz dedupe (case-insensitive)
  - remove o próprio `clienteEmail` da lista (não envia duplicado para o cliente)
- Validação no `handleEnviar`:
  - Para cada e-mail em CC, validar com regex simples (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Se algum for inválido, `toast.error` com o e-mail problemático e abortar.
- Fluxo de envio dentro de `handleEnviar`:
  1. Invocar `send-transactional-email` para `clienteEmail` (igual ao atual).
  2. Para cada e-mail válido em CC, invocar `send-transactional-email` em paralelo (`Promise.allSettled`) com o **mesmo** `templateName`, `templateData` e `attachmentPaths`, apenas trocando `recipientEmail`.
  3. Se o envio principal falhar, abortar (não envia cópias, não marca `declaracao_enviada_em`).
  4. Se o principal funcionar e alguma cópia falhar, exibir `toast.warning` listando os e-mails que falharam, mas manter sucesso geral (declaração já foi enviada ao cliente).
- O `update` de `declaracao_enviada_em` continua sendo feito **apenas uma vez**, após o envio principal bem-sucedido.

### 2) Nenhuma mudança em `Declaracoes.tsx`, `DeclaracaoDetalhe.tsx` ou na edge function

As props existentes do modal já são suficientes — o campo CC é estado interno do próprio modal.

## Sem regressões

- Campo é opcional e vazio por padrão → comportamento atual idêntico quando não preenchido.
- Edge function não muda → demais fluxos (`boas-vindas`, `convite-cliente`, `cobranca-*`, etc.) intactos.
- Anexos via `attachmentPaths` continuam gerando links assinados (não duplica armazenamento).
- Mensagem do corpo é a mesma para todos os destinatários (cliente + cópias), o que é o esperado para uma "cópia" do e-mail.

## Validação manual após implementação

1. Abrir modal em `/declaracoes` para uma declaração com DARF → preencher `cc1@teste.com, cc2@teste.com` → confirmar.
2. Verificar em `email_send_log` que existem 3 linhas com mesmo template e timestamps próximos (1 para cliente, 2 para cc).
3. Repetir sem preencher CC → 1 linha apenas, comportamento atual preservado.
4. Tentar e-mail inválido (`foo`) → toast de erro, nenhuma invocação feita.

## Pontos abertos para o usuário

- **Limite de cópias**: sugiro impor um máximo de **5 e-mails** em CC para evitar abuso/rate-limit. OK manter 5, ou prefere outro número / sem limite?
- **Persistência**: deseja que a lista de e-mails em cópia fique salva por cliente (ex.: sócio do cliente que sempre recebe cópia) ou é OK ser sempre digitada manualmente a cada envio? (Persistir exigiria nova coluna em `clientes` — fora do escopo deste plano; aviso caso queira.)
