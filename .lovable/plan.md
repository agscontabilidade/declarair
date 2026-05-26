## Problema

Na tela de criação de conta via convite direto (`/cliente/convite/:token` → `register-from-direct-invite`), o erro:

> `duplicate key value violates unique constraint "idx_clientes_auth_user"`

acontece porque o email do convite (`contato@agscont.com.br`) já existe no Supabase Auth — é o próprio dono do escritório (e/ou já está vinculado a outro registro em `clientes`). A função reaproveita esse `auth_user_id` via `listUsers()` e tenta gravá-lo em `clientes.auth_user_id`, violando o índice único.

## Causa

A edge function `register-from-direct-invite` não valida:
1. Se o `userId` reaproveitado já pertence a um `usuarios` (contador/dono) — staff não pode virar cliente.
2. Se o `userId` já está vinculado a um **outro** registro em `clientes` (cliente em outro escritório, por exemplo).

Quando qualquer dessas condições é verdadeira, o `UPDATE clientes SET auth_user_id = …` quebra com violação do índice único e o usuário vê a mensagem técnica.

## Solução (escopo estrito)

Editar APENAS `supabase/functions/register-from-direct-invite/index.ts`. Sem migração, sem mudar fluxos de login/recuperação/cadastro de contador/cliente normal.

Antes do `UPDATE` final em `clientes`:

1. Verificar se `userId` já existe em `public.usuarios`:
   - Se sim → erro amigável: *"Este email já está em uso por um usuário do escritório. Use outro email para o cadastro do cliente ou peça ao responsável para alterar o email do convite."*
2. Verificar se já existe outra linha em `clientes` com esse `auth_user_id` diferente do `cliente.id` atual:
   - Se sim → erro amigável: *"Este email já está vinculado a outro cliente. Solicite ao seu contador um novo convite com um email diferente."*
3. Só então executar o `UPDATE`.

Adicionalmente, na ramificação onde criamos um auth user novo e o email já existe (`listUsers` encontra), aplicar as MESMAS duas verificações antes de reaproveitar — para falhar cedo, sem alterar a senha do dono.

## Garantias de não-quebra

- Nenhuma alteração no schema, RLS, triggers, RPCs ou outros edge functions.
- Convites normais (email novo) continuam funcionando idênticos.
- Recuperação de senha, login do cliente, cadastro via `register-from-invite` (fluxo de token público) não são tocados.
- Apenas adicionamos guardas antes do `UPDATE` que já estava falhando — comportamento de sucesso permanece igual.

## Arquivos

- `supabase/functions/register-from-direct-invite/index.ts` (somente)

## Fora de escopo

- Migrações de banco
- `register-from-invite`, `validate-invite-token`, `RecuperarSenha`, `RedefinirSenha`, `AuthContext`
- Qualquer mudança de UI além da mensagem de erro retornada pela função (que já é exibida pelo toast existente)
