# Corrigir fluxo "Esqueci a senha" e isolamento entre Login do Contador e Portal do Cliente

## Causa raiz

1. `RecuperarSenha.tsx` tem `<Link to="/login">` hardcoded em dois pontos, então o botão "Voltar ao login" sempre cai na Área do Contador, mesmo quando o cliente veio do portal.
2. `Login.tsx` (Área do Contador) e `ClienteLogin.tsx` (Portal do Cliente) **aceitam qualquer tipo de usuário** no formulário e simplesmente redirecionam para o painel do papel real. Por isso o cliente, ao logar na tela do contador, ainda entra normalmente em `/cliente/dashboard` — parece "login do contador" pela aparência da tela, mas o Supabase está autenticando o próprio cliente.

## Mudanças (somente frontend, sem mexer em banco/RLS/edge functions)

### 1. `src/pages/cliente/ClienteLogin.tsx`
- Trocar `to="/recuperar-senha"` por `to="/recuperar-senha?origem=cliente"` no link "Esqueceu sua senha?".
- No `useEffect` de redirect: se `userType === 'contador'`, **não** redirecionar para `/dashboard`. Em vez disso, fazer `await signOut()` e mostrar um toast "Esta conta é de contador. Use a Área do Contador." Mantém o usuário no `/cliente/login`.

### 2. `src/pages/Login.tsx` (Área do Contador)
- Trocar `to="/recuperar-senha"` por `to="/recuperar-senha?origem=contador"`.
- No `useEffect`: se `userType === 'cliente'`, fazer `signOut()` + toast "Esta conta é de cliente. Use o Portal do Cliente." e manter em `/login`. Admin continua sendo redirecionado para `/admin`.

### 3. `src/pages/RecuperarSenha.tsx`
- Ler `useSearchParams()` para pegar `origem` (`cliente` | `contador`, default `contador`).
- Calcular `backTo = origem === 'cliente' ? '/cliente/login' : '/login'`.
- Substituir os dois `<Link to="/login">` por `<Link to={backTo}>`.
- Passar a origem adiante no `redirectTo` do `resetPasswordForEmail`: `${PORTAL_BASE_URL}/redefinir-senha?origem=${origem}` (para o RedefinirSenha já saber para onde mandar depois do reset).

### 4. `src/pages/RedefinirSenha.tsx`
- Após `updateUser`, priorizar `searchParams.get('origem')` para decidir `redirectTo`. Manter o lookup atual na tabela `clientes` apenas como fallback (já existe e funciona, só fica mais resiliente).

## Fora de escopo
- Banco, RLS, edge functions, fluxo de admin.
- Visual/layout das páginas (apenas adicionar toasts já existentes via `use-toast`).

## Validação
- Cliente → `/cliente/login` → "Esqueci senha" → "Voltar ao login" deve voltar para `/cliente/login`.
- Contador → `/login` → "Esqueci senha" → "Voltar ao login" deve voltar para `/login`.
- Cliente tentando logar em `/login`: rejeitado com toast, sem entrar.
- Contador tentando logar em `/cliente/login`: rejeitado com toast, sem entrar.
- Reset de senha completo: cliente é mandado para `/cliente/login`, contador para `/login`.
