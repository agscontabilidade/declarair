## Plano

Corrigir apenas o fluxo da tela `/redefinir-senha`, mantendo login, convite, recuperação e sessões principais intactos.

### O que vou ajustar

1. **Preservar a sessão de recuperação até o clique no botão**
   - O botão provavelmente não conclui porque o cliente dedicado de recuperação foi criado com `persistSession: false`, então a sessão detectada ao abrir o link pode não ficar disponível para o `updateUser()` no submit.
   - Vou manter a sessão isolada no `storageKey` separado, mas permitir persistência somente nesse client auxiliar.

2. **Guardar a sessão validada em memória na página**
   - Em `RedefinirSenha.tsx`, ao detectar `PASSWORD_RECOVERY`, `SIGNED_IN` ou sessão existente, vou salvar essa sessão no estado da própria página.
   - No clique do botão, antes de chamar `updateUser`, vou garantir que existe sessão de recovery ativa.

3. **Melhorar falha do botão sem quebrar UX**
   - Se a sessão tiver expirado ou não existir, mostrar toast claro e voltar para “Link Inválido”, em vez de parecer que o botão não fez nada.
   - Manter o redirecionamento atual por `origem=cliente` ou `origem=contador`.

### Arquivos previstos

- `src/lib/supabase-auth-recovery.ts`
- `src/pages/RedefinirSenha.tsx`

### Fora do escopo

- Não vou alterar `src/integrations/supabase/client.ts`.
- Não vou mexer em template de email, convite de cliente, login, AuthContext, banco, RLS ou outros fluxos funcionando.
- Não vou mudar design da tela.