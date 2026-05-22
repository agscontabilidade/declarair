## Objetivo

No modal de envio de e-mail em `/declaracoes`, carregar a última mensagem efetivamente enviada ao cliente (em vez da mensagem padrão) toda vez que o modal for aberto para a mesma declaração.

## Abordagem

Persistir a mensagem por declaração no banco e, ao abrir o modal, pré-carregar essa mensagem caso exista. Manter o template padrão apenas quando ainda não houve envio anterior. Incluir um botão para "Restaurar mensagem padrão" caso o contador queira voltar ao texto automático.

## Mudanças

### 1. Banco (migração)

Adicionar duas colunas em `public.declaracoes`:

- `ultima_mensagem_email text null`
- `ultima_mensagem_email_em timestamptz null`

Sem alteração de RLS (já coberta pelas políticas existentes da tabela). Sem backfill — declarações antigas continuam abrindo com a mensagem padrão até o próximo envio.

### 2. `EnviarDeclaracaoEmailModal.tsx`

- Ao abrir o modal (`open && declaracaoId`), buscar `ultima_mensagem_email` da declaração.
- Novo estado `mensagemPersonalizada: boolean`:
  - Se a declaração tem `ultima_mensagem_email` salva → usar esse texto e marcar como personalizada (não sobrescrever no `useEffect` do template padrão).
  - Caso contrário → manter o comportamento atual (template padrão recalculado quando muda nome/ano/cobrança/DARF).
- Ao editar a textarea, marcar `mensagemPersonalizada = true` para não ser sobrescrita pelo `useEffect` do template.
- Adicionar link/botão discreto "Restaurar mensagem padrão" abaixo da textarea, que reseta `mensagemPersonalizada = false` e regenera o template.
- Após envio principal bem-sucedido (antes do toast de sucesso), gravar:
  ```
  update declaracoes set ultima_mensagem_email = mensagem,
                        ultima_mensagem_email_em = now()
  where id = declaracaoId
  ```
  Falha nesse update apenas loga warning — não bloqueia o sucesso do envio.

### 3. Sem mudanças em

- `Declaracoes.tsx`, `DeclaracaoDetalhe.tsx` (props existentes bastam).
- Edge Functions (`send-transactional-email` inalterada).
- Lógica de CC (independente — não foi pedida agora).

## Comportamento

- **1ª vez enviando**: abre com template padrão (como hoje).
- **2ª vez em diante**: abre com a última mensagem enviada, editável.
- Se cliente / ano / valor da cobrança mudar entre envios, o texto salvo permanece — usuário pode clicar "Restaurar mensagem padrão" para regenerar com os novos dados.
- Sem regressões: declarações sem coluna preenchida seguem fluxo atual.

## Pontos a confirmar

1. **Escopo da persistência**: salvar **por declaração** (proposto) ou **por cliente** (todas as declarações do mesmo cliente compartilham a última mensagem)? A primeira opção é mais segura porque cada ano tem contexto próprio.
2. **Salvar também os e-mails em cópia (CC)** da última vez? Não foi pedido, mas é uma extensão natural. Por padrão **não** vou salvar.