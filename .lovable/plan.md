

# Plano — Corrigir erro "Invalid login credentials" após redefinição de senha

## Diagnóstico

O problema ocorre porque, após `supabase.auth.updateUser({ password })` ter sucesso, o código faz `navigate('/login')` **sem encerrar a sessão de recovery**. O usuário chega na tela de login ainda com uma sessão ativa (do token de recovery). Ao tentar logar com a nova senha, o estado da sessão conflita e resulta em "Invalid login credentials".

Além disso, o `AuthContext` também escuta `onAuthStateChange` e tenta carregar o perfil durante o evento `PASSWORD_RECOVERY`, criando uma condição de corrida.

## Correção

**Arquivo: `src/pages/RedefinirSenha.tsx`** — Uma mudança no `handleSubmit`:

Após `updateUser` ter sucesso, chamar `supabase.auth.signOut()` **antes** de navegar para `/login`. Isso limpa a sessão de recovery e garante que o usuário possa fazer login limpo com a nova senha.

```typescript
const { error } = await supabase.auth.updateUser({ password: novaSenha });
if (error) throw error;
await supabase.auth.signOut();  // ← adicionar esta linha
toast({ title: 'Senha redefinida com sucesso!' });
navigate('/login');
```

Nenhum outro arquivo precisa ser alterado.

