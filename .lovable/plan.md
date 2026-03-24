

# Plano — Recuperação de Senha

## Resumo

Implementar fluxo completo de "Esqueci minha senha" para ambos os portais (Contador e Cliente), com 3 partes: link na tela de login, envio do email de reset, e página para definir nova senha.

---

## 1. Criar página `/recuperar-senha` (solicitar reset)

**Novo arquivo: `src/pages/RecuperarSenha.tsx`**

Página pública com o mesmo visual dos logins (Card centralizado, logo DeclaraIR). Campos:
- Input de email
- Botão "Enviar link de recuperação"

Ao submeter, chama:
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/redefinir-senha`
});
```

Após sucesso, exibe mensagem: "Se este email estiver cadastrado, você receberá um link para redefinir sua senha." Toast de sucesso. Botão "Voltar ao login".

---

## 2. Criar página `/redefinir-senha` (definir nova senha)

**Novo arquivo: `src/pages/RedefinirSenha.tsx`**

Página pública que:
1. No `useEffect`, detecta o evento `PASSWORD_RECOVERY` via `onAuthStateChange`
2. Exibe formulário com dois campos: "Nova senha" e "Confirmar nova senha"
3. Validações: mínimo 6 caracteres, senhas devem coincidir
4. Ao submeter, chama `supabase.auth.updateUser({ password: novaSenha })`
5. Após sucesso, toast "Senha redefinida com sucesso!" e redireciona para `/login`
6. Se não houver sessão de recovery, exibe mensagem "Link inválido ou expirado" com botão para solicitar novo link

---

## 3. Adicionar link "Esqueci minha senha" nos logins

**`src/pages/Login.tsx`** — Abaixo do botão "Entrar" (dentro da tab "entrar"), adicionar:
```
<button className="text-sm text-muted-foreground hover:text-primary">
  Esqueceu sua senha?
</button>
```
Ao clicar, navega para `/recuperar-senha`.

**`src/pages/cliente/ClienteLogin.tsx`** — Mesmo link abaixo do botão "Entrar".

---

## 4. Registrar rotas no App.tsx

Adicionar duas rotas públicas:
```tsx
<Route path="/recuperar-senha" element={<RecuperarSenha />} />
<Route path="/redefinir-senha" element={<RedefinirSenha />} />
```

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/RecuperarSenha.tsx` |
| Criar | `src/pages/RedefinirSenha.tsx` |
| Editar | `src/pages/Login.tsx` — link "Esqueceu sua senha?" |
| Editar | `src/pages/cliente/ClienteLogin.tsx` — mesmo link |
| Editar | `src/App.tsx` — 2 rotas públicas |

Nenhuma alteração de banco, design system ou dependências.

