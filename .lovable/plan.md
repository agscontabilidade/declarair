## Diagnóstico

O link "Link Inválido" aparece porque o cliente Supabase está usando **PKCE como flow padrão** (v2.99.x). No PKCE, o `resetPasswordForEmail` armazena um `code_verifier` no localStorage do navegador que pediu o reset, e o link de recuperação chega como `?code=xxx`. O `exchangeCodeForSession` automático **só funciona se o usuário clicar no link no mesmo navegador/dispositivo** onde solicitou.

Cenário real do cliente do contador:
- Solicita reset no celular → recebe email → abre no desktop (ou no app de email, que pré-fetch o link no Gmail/Outlook, consumindo o code) → desktop não tem o `code_verifier` → erro `invalid request: both auth code and code verifier should be non-empty` → cai no fallback "Link Inválido".

Confirmação no código:
- `src/integrations/supabase/client.ts` não define `flowType` → default PKCE.
- `RedefinirSenha.tsx` só escuta o evento `PASSWORD_RECOVERY` ou hash `type=recovery` — nunca trata `?code=` falhando.
- Não há `exchangeCodeForSession` em lugar nenhum.

Não posso editar `src/integrations/supabase/client.ts` (arquivo auto-gerado).

## Solução

Criar um **cliente auxiliar Supabase em flow `implicit`** dedicado ao fluxo de recuperação de senha. No flow implicit, o link de recuperação não depende de `code_verifier`, funcionando cross-device (Supabase verifica o token server-side e redireciona com `#access_token=...&type=recovery` no hash).

### Mudanças

1. **`src/lib/supabase-auth-recovery.ts`** (novo)
   - Instanciar um segundo `createClient` apontando para a mesma URL/anon key, com:
     - `flowType: 'implicit'`
     - `storageKey: 'sb-declarair-recovery'` (isola da sessão principal para não derrubar o usuário logado)
     - `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: true`

2. **`src/pages/RecuperarSenha.tsx`**
   - Trocar `supabase.auth.resetPasswordForEmail` pelo client de recovery, mantendo `redirectTo` apontando para `/redefinir-senha?origem=...`.

3. **`src/pages/RedefinirSenha.tsx`**
   - Usar o client de recovery para detectar a sessão de recuperação (hash `#access_token` + `type=recovery`) e chamar `updateUser({ password })`.
   - Manter o listener `onAuthStateChange('PASSWORD_RECOVERY')` no client de recovery.
   - Após sucesso, fazer `signOut()` apenas no client de recovery (não derruba sessão principal de outros usuários).
   - Aumentar o timeout de "checking" e mostrar a mensagem de erro real do Supabase quando vier (`?error=...` ou `#error=...` no URL) em vez de só "Link Inválido".
   - Manter a lógica de redirect por `origem` (cliente vs contador).

### Não muda
- Template de email `recovery.tsx` (continua usando `confirmationUrl`).
- `auth-email-hook` (continua repassando `payload.data.url`).
- Fluxo de invite de cliente, login, e cliente principal Supabase.

## Riscos / validações

- Verificar no preview o fluxo completo: solicitar reset como cliente → abrir link em aba anônima (simulando outro dispositivo) → trocar senha → login em `/cliente/login`.
- Garantir que `storageKey` separado não conflita com o client principal nem com o `localStorage` do AuthContext.
- Confirmar que nenhum outro lugar do código chama `resetPasswordForEmail` ou depende do hash de recovery no client principal.
