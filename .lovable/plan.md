## Mudança no header do DashboardLayout

**Arquivo:** `src/components/layout/DashboardLayout.tsx`

1. Remover o `<SidebarTrigger />` (linha 26) — o ícone que recolhe a sidebar.
2. No lugar dele, exibir uma saudação com o **primeiro nome** do usuário logado: `Olá, Fulano`.
   - Usar `profile.nome` do `useAuth()` (já importado) e pegar a primeira palavra: `profile.nome?.split(' ')[0]`.
   - Fallback: se não houver nome, exibir apenas `Olá`.
   - Tipografia: `text-sm font-medium text-foreground` (alinhado ao estilo do header).
3. Manter `ThemeToggle` e `NotificacoesBell` exatamente onde estão (à direita).

**Sem alterações:** sidebar em si, lógica de auth, outras páginas, mobile (o trigger da sidebar mobile é separado e não está nesse header — confirmo no build se necessário, mas o `SidebarTrigger` mostrado é o único nessa barra).

**Resultado visual:**
```
[Olá, Fulano]                              [☀️] [🔔]
```
