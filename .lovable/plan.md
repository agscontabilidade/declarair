## Objetivo

Restaurar o tema claro como padrão do sistema (área principal/conteúdo), mantendo o menu lateral escuro como hoje, e adicionar um seletor de tema (Claro / Escuro / Automático) acessível para Contadores e Clientes, com preferência salva por usuário.

## Estado atual

- `src/index.css` está com `:root` definido em cores escuras (forcei o sistema todo em dark na resposta anterior).
- Sidebar herda `--sidebar-*` que já é escuro — por isso o menu está correto.
- Landing pages (`Index.tsx` e `LandingV2.tsx`) já usam classe `.landing-v2` ou containers próprios para o tema escuro premium.

## Mudanças planejadas

### 1. Restaurar tema claro como padrão do sistema

Em `src/index.css`:
- `:root` volta para a paleta clara (background branco, foreground escuro, bordas cinza claro, etc.).
- Variáveis `--sidebar-*` permanecem escuras (navy `222 47% 11%`) para manter o menu lateral escuro independente do tema do corpo.
- Adicionar bloco `.dark { ... }` com a paleta escura completa (incluindo overrides do sidebar se necessário) para quando o usuário ativar dark mode.

Resultado: corpo branco por padrão, sidebar escuro sempre, e classe `.dark` no `<html>` ativa modo escuro completo.

### 2. Sistema de seleção de tema

Criar `ThemeProvider` (`src/contexts/ThemeContext.tsx`):
- Estados: `'light' | 'dark' | 'system'`.
- Aplica/remove classe `dark` no `document.documentElement`.
- Persiste em `localStorage` (chave `declarair-theme`) e, quando autenticado, sincroniza com a coluna `tema_preferido` do usuário.
- Escuta `prefers-color-scheme` quando estiver em `system`.

Envolver `App.tsx` com `<ThemeProvider>` logo após `AuthProvider`.

### 3. Componente ThemeToggle

Criar `src/components/ThemeToggle.tsx`:
- DropdownMenu com opções Claro / Escuro / Automático (ícones Sun / Moon / Monitor do lucide-react).
- Reutilizável tanto na área do contador quanto na do cliente.

Pontos de inserção:
- Header do contador (perto do avatar/sino).
- Header do cliente (`ClienteLayout.tsx`).
- Página `Perfil.tsx` (seção "Aparência" com a mesma escolha, descrita em texto).

### 4. Persistência por usuário

Adicionar coluna nas tabelas existentes via migration:
- `usuarios.tema_preferido text default 'system' check (tema_preferido in ('light','dark','system'))`
- `clientes.tema_preferido text default 'system' check (...)`

Ao logar, o `ThemeProvider` lê a preferência da tabela correspondente (via `useAuth().userType`) e aplica. Ao alterar no toggle, faz `update` na linha do usuário.

### 5. Garantias de não-regressão

- Landing pages continuam com seu próprio tema escuro (containers `.landing-v2` / `Index.tsx`) — não dependem do `:root` global.
- Páginas internas que usam `bg-background`, `text-foreground`, `bg-card`, etc., responderão automaticamente ao toggle.
- Componentes que tinham cores hardcoded escuras serão revisados pontualmente se quebrarem no modo claro (ex.: cards do dashboard).

## Detalhes técnicos

- `tailwind.config.ts` já está com `darkMode: ["class"]` — nenhum ajuste necessário.
- A classe `dark` é aplicada no `<html>`, então o sidebar (que usa `--sidebar-background` fixo navy) permanece escuro em ambos os modos. Se o usuário quiser que o sidebar acompanhe o tema no futuro, basta mover as variáveis do sidebar para dentro de `:root` e `.dark`.
- Migration de DB usa `alter table ... add column if not exists`.

## Fora de escopo

- Não muda o tema da área administrativa (`/admin/*`) nesta entrega — pode ser adicionado depois com a mesma infra.
- Não cria temas customizados (apenas claro/escuro/auto).