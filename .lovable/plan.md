# Onda 3 — Melhorar percepção de carregamento entre páginas

Hoje, ao trocar de rota, o usuário vê um **spinner em tela cheia** (FullscreenSpinner do `Suspense` no `App.tsx`) seguido de outro spinner dentro da página enquanto os dados carregam. Isso causa "piscadas" e sensação de lentidão mesmo quando a query é rápida.

## O que vou mudar (apenas frontend/UX, sem mexer em backend, RLS ou regras de negócio)

### 1. Prefetch de rotas no hover/focus dos links da Sidebar
- Hoje cada página é `lazy()` no `App.tsx`. O chunk só começa a baixar quando o usuário clica.
- Adicionar prefetch ao passar o mouse sobre o item do menu (`Sidebar.tsx` / `NavLink.tsx`) usando `import()` dinâmico. Resultado: ao clicar, o chunk já está em cache → transição praticamente instantânea.

### 2. Trocar o `FullscreenSpinner` global por transição suave
- O `<Suspense fallback={<FullscreenSpinner />}>` no `App.tsx` cobre a tela inteira em cada navegação lazy.
- Substituir por um fallback mínimo (barra de progresso fina no topo, estilo NProgress, ou simplesmente manter o layout anterior por alguns ms via `startTransition`).
- Usar `React.startTransition` nos cliques de navegação para evitar o "flash" branco.

### 3. Skeletons consistentes nas páginas pesadas (Dashboard, Declarações, Clientes, Drive)
- Hoje muitas páginas mostram um spinner centralizado quando `isLoading=true`. Trocar por skeletons que imitam a estrutura final (cards/linhas de tabela). Percepção de velocidade melhora ~30–50% sem ganho real de tempo.
- Reusar o componente `Skeleton` do shadcn que já está no projeto.

### 4. Prefetch de queries críticas em paralelo ao carregamento do chunk
- Ao prefetch de uma rota (passo 1), também disparar `queryClient.prefetchQuery` das queries principais daquela página (ex: hover em "Dashboard" → prefetch do `dashboard_kpis`).
- Isso elimina o segundo spinner (o de dados) depois do chunk carregar.

### 5. Manter dados antigos enquanto refaz fetch (`placeholderData: keepPreviousData`)
- Em listas paginadas/filtradas (Declarações, Clientes, Cobranças), aplicar `placeholderData: (prev) => prev` para que mudar filtro/aba não pisque o layout.

### 6. Layout estável durante `Suspense`
- Garantir que `DashboardLayout` (sidebar + topbar) renderize **fora** do `Suspense` de rota — hoje cada página lazy traz seu próprio layout, então o sidebar pisca a cada navegação.
- Mover a `<Routes>` para dentro de um layout pai compartilhado nas rotas autenticadas de contador. Sidebar e topbar ficam fixos; só o conteúdo central entra no Suspense.

## Arquivos afetados (estimativa)

- `src/App.tsx` — fallback do Suspense, layout compartilhado, startTransition
- `src/components/layout/DashboardLayout.tsx` + `Sidebar.tsx` + `NavLink.tsx` — prefetch on hover
- `src/pages/Dashboard.tsx`, `Declaracoes.tsx`, `Clientes.tsx`, `Cobrancas.tsx`, `Drive.tsx` — skeletons + keepPreviousData
- Novo: `src/lib/routePrefetch.ts` — mapa rota → `import()` + queries a prefetchar
- Nenhuma migração SQL, nenhuma alteração em hooks de dados, RLS, billing ou edge functions

## O que NÃO vou mexer

- Backend, RPCs, RLS, multi-tenancy
- Lógica de IRPF, cobranças, billing
- Design system (cores, fontes)
- Onda 1 e 2 já entregues permanecem como estão

## Ganho esperado

- Navegação entre páginas autenticadas: de ~600–1200ms com 2 spinners para **<150ms sem flash** (chunk e dados pré-carregados no hover).
- Primeira carga após login: mesma velocidade, mas sem o "pulo" do sidebar.
