## Problema

Cliente `ALDEMIR MANTA` (e potencialmente outros) está em estado inconsistente:
- `auth_user_id` está preenchido (existe usuário no Auth)
- `status_onboarding = 'convite_enviado'` (não finalizado)
- `token_convite` ainda válido

A página `/cliente/convite/:token` valida o token via RPC e mostra o formulário “Crie sua conta” (porque o RPC só checa `status='concluido'`, não `auth_user_id`). Ao submeter, a edge function `register-from-direct-invite` bloqueia com `"Este cliente já possui uma conta"` → o front mostra apenas `"Edge Function returned a non-2xx status code"`.

Além disso, o link antigo do print (`25999bc0…`) não existe mais — foi substituído quando o convite foi reenviado.

## Correções

### 1. Reparar o cliente ALDEMIR (migration única)

Verificar via SQL se o `auth.users` existe para esse `auth_user_id`. Dois cenários:
- **Auth user existe**: finalizar o onboarding → `status_onboarding='concluido'`, limpar `token_convite` e `token_convite_expira_em`. Criar `declaracao` + `checklist_documentos` do ano atual se ainda não existirem.
- **Auth user NÃO existe**: limpar `auth_user_id` para permitir novo registro pelo fluxo normal.

### 2. Tornar `register-from-direct-invite` idempotente

Reescrever a lógica para tratar estados inconsistentes em vez de falhar:

- Se cliente tem `auth_user_id` e o auth user existe e o e-mail bate:
  - Atualizar a senha desse usuário (`auth.admin.updateUserById`)
  - Finalizar onboarding (status, limpar tokens)
  - Garantir declaração e checklist do ano atual (idempotente — só cria se não houver)
  - Retornar sucesso para o front fazer login
- Se cliente tem `auth_user_id` mas auth user sumiu: limpar `auth_user_id` e seguir o fluxo normal de criar usuário.
- Se não tem `auth_user_id`: fluxo atual (criar auth user + vincular).
- Em todos os caminhos, idempotência na criação de `declaracoes` e `checklist_documentos` (verificar `(cliente_id, ano_base)` antes de inserir).

### 3. Melhorar mensagens de erro no front

Em `ConviteCliente.tsx`, quando a edge function retornar erro, mostrar a mensagem específica do servidor (`data.error`) em vez de só `"Edge Function returned a non-2xx status code"`. Hoje isso já está parcialmente feito (`if (data?.error) throw new Error(data.error)`), mas quando `error` (do invoke) vem antes de `data`, a mensagem do servidor se perde. Ajustar para sempre tentar ler `data?.error` mesmo quando `error` está presente.

### 4. Landing já cobre “expirado/inexistente”

A página já trata os três estados (`concluido`, `expirado`, `inexistente`) com botão para falar com suporte e link “Já tenho conta — fazer login”. Mantém como está; apenas verificar que o fluxo do item 2 não mais retorna 400 nesse caso de inconsistência.

## Arquivos afetados

- `supabase/migrations/<novo>.sql` — reparo pontual do cliente ALDEMIR
- `supabase/functions/register-from-direct-invite/index.ts` — idempotência total
- `src/pages/cliente/ConviteCliente.tsx` — extrair mensagem real do erro da edge function

## Validação

- Testar via `curl_edge_functions` com o token atual do ALDEMIR → deve retornar 200 e cliente consegue logar.
- Verificar via SQL que ALDEMIR fica com `status_onboarding='concluido'` e tokens limpos, sem duplicar declaração/checklist.
