
# Auditoria de Performance — DeclaraIR

Objetivo: deixar o sistema **brutalmente rápido** sem mexer em lógica de negócio nem em regras do banco/RLS. Tudo abaixo é otimização não-funcional — comportamento observável permanece idêntico.

Métrica de hoje (estimativa a partir do código): ~33k linhas TS/TSX em um único bundle JS inicial. Tempo de TTI alto em conexões médias por causa de (1) zero code-splitting, (2) bibliotecas pesadas carregadas eagermente, (3) 3 queries sequenciais no login antes de renderizar qualquer rota, (4) `select('*')` em quase todos os hooks puxando JSONBs gigantes do `formulario_ir`/`declaracoes`.

---

## 1. Diagnóstico — pontos de lentidão encontrados

### 1.1 Bundle inicial monolítico (impacto: ALTO)
- `src/App.tsx` faz `import` **estático** de 50+ páginas. Nada de `React.lazy`. Resultado: o visitante que cai na `/` (LandingV2) baixa também AdminDashboard, DeclaracaoDetalhe, SecaoAnaliseCaixa (737 linhas), VisualIAFiscal (669 linhas), todo o portal do cliente, etc.
- Dependências pesadas que entram no chunk principal:
  - `framer-motion` (~120kB gzip) usado em **23 arquivos**, a maioria na landing.
  - `recharts` (chart.tsx) — só usado em `/relatorios` e dashboards admin.
  - `lottie-react` — só na landing.
  - `react-pdf` + worker pdf.js — só no `Drive` viewer.
  - `jspdf` + `pdf-lib` — geração de PDFs específica.
  - `embla-carousel`, `react-day-picker`, `cmdk`, `react-resizable-panels` — uso esporádico.
- **Custo real**: cada rota paga ~1.5–2.5MB de JS para abrir o login.

### 1.2 AuthContext bloqueia o primeiro paint (impacto: ALTO)
`src/contexts/AuthContext.tsx#loadProfile` faz, em série:
1. `auth.getSession()` → 2. `auth.getUser()` (round-trip extra ao Supabase) → 3. SELECT user_roles → 4. SELECT usuarios → 5. SELECT escritorios → 6. SELECT clientes.

São 4 a 6 round-trips sequenciais antes da primeira tela autenticada. `getUser()` é validação remota redundante quando `getSession()` já devolveu um JWT válido localmente — pode ser feito em background.

### 1.3 `QueryClient` sem defaults (impacto: MÉDIO-ALTO)
`new QueryClient()` em `App.tsx` aceita os defaults do React Query, que incluem `refetchOnWindowFocus: true` e `staleTime: 0`. Toda volta de aba dispara refetch global → flicker + pressão no banco. Hooks individuais já configuram `staleTime`, mas a maioria das queries não.

### 1.4 `select('*')` generalizado (impacto: MÉDIO-ALTO)
24 hooks/páginas usam `select('*')`. Crítico em:
- `useDeclaracao`, `useFormularioIR`, `useClientePerfil`, `useClientePortal` — a tabela `formulario_ir` tem 10+ colunas JSONB (dependentes, rendimentos, bens, etc.) que podem chegar a centenas de KB cada.
- `useDashboardData` já faz `select` enxuto, mas depois roda **uma segunda query** `checklist_documentos` em `.in(ids)` — quando o kanban tem 100+ cards isso vira pacote grande.

### 1.5 Realtime sem filtro / sem throttle (impacto: MÉDIO)
- `useDashboardData` abre canal `declaracoes` por escritório (ok), mas a cada evento invalida **duas** queries — qualquer drag no kanban causa refetch completo.
- `useChat`, `useNotificacoes`, `useCobrancasAtrasadas`, `useDeclaracao` cada um cria canal próprio. Várias páginas montam canais sobrepostos.
- Nenhum debounce nas invalidations de Realtime → ráfagas de update causam N refetches.

### 1.6 Componentes gigantes sem memoização (impacto: MÉDIO)
- `SecaoAnaliseCaixa.tsx` (737 linhas), `VisualIAFiscal.tsx` (669), `IntegracoesTab.tsx` (585), `StepDadosPessoais.tsx` (549), `MensagensTab.tsx`, `DocumentosDeclaracaoModal.tsx` — re-renderizam inteiros a cada change de form.
- `KanbanBoard` recalcula `grouped = displayItems.filter(...)` 4× a cada render; não usa `useMemo`.
- Apenas 15 de ~200 componentes usam `memo/useMemo/useCallback`.

### 1.7 Paginação / queries N+1
- `useClientes`: paginação ok (20/página), mas o join `usuarios!clientes_contador_responsavel_id_fkey(nome)` traz dados que poderiam vir do cache de `contadores`.
- `useDashboardData`: 2ª query para contar checklist (`pendingDocs/totalDocs`) é client-side aggregation; deveria virar uma view/RPC ou ao menos vir junto via embedded count.
- KPIs do dashboard fazem **4 HEAD counts** paralelos a cada load — ok hoje, mas viraria 1 RPC.

### 1.8 Fontes / assets
- Não há evidência de `font-display: swap` configurado nem preconnect para CDN de fontes.
- LandingV2 importa 20+ componentes com `motion` mesmo acima do fold.
- Imagens: não há uso de `vite-imagetools`, `loading="lazy"` nem `fetchpriority` nos heros.

### 1.9 Outros pequenos
- `console.log('[AuthContext] Auth event:'...)` em produção.
- `setTimeout(..., 1500)` no `KanbanBoard` para invalidar — adiciona latência percebida.
- Sentry inicializado em todos os builds (verificar se DSN é gated por env).

---

## 2. Plano de otimização — faseado, seguro, sem quebras

Cada fase é independente. Pode ser feita em PR separado e revertida sem afetar a anterior.

### Fase 1 — Code-splitting e bundle (ganho esperado: -60% a -75% JS inicial)
1. Converter **todas** as páginas em `React.lazy` no `App.tsx`, envolvendo `<Routes>` em `<Suspense fallback={<SpinnerFullscreen/>}>`. Comportamento idêntico, só muda quando o chunk baixa.
2. Lazy-load por rota das libs pesadas:
   - `recharts` → só dentro de `Relatorios` e admin charts.
   - `react-pdf` → já está só no `PdfViewer`; garantir que `FileViewerModal` faça `lazy(() => import('./viewers/PdfViewer'))`.
   - `jspdf` / `pdf-lib` → `import()` dinâmico dentro do handler de "gerar PDF".
   - `lottie-react` → `lazy` no `LottieIcon`.
   - `framer-motion` na landing: trocar `import { motion } from 'framer-motion'` por `import { m, LazyMotion, domAnimation } from 'framer-motion'` com `LazyMotion` no topo da landing (~70% menos JS de animação). **Não muda nada visual.**
3. Adicionar `manualChunks` no `vite.config.ts` separando: `react-vendor`, `radix-vendor`, `supabase`, `recharts`, `framer-motion`, `pdf`. Resultado: cache HTTP melhor entre deploys.
4. Garantir `build.target: 'es2020'` e `cssCodeSplit: true` (default em Vite 5, conferir).

### Fase 2 — React Query defaults globais (ganho: -30% a -50% requisições)
1. Em `App.tsx`:
   ```ts
   new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 60_000,
         gcTime: 5 * 60_000,
         refetchOnWindowFocus: false,
         refetchOnReconnect: 'always',
         retry: 1,
       },
     },
   })
   ```
   Hooks que precisam de tempo real continuam definindo `staleTime` próprio.
2. Adicionar `QueryClientProvider` único + `persistQueryClient` com `localStorage` apenas para queries com chave `['constants', ...]` (templates, contadores, plano). Hidratação instantânea entre sessões.

### Fase 3 — Auth mais rápido (ganho: -1 a -2s no primeiro render autenticado)
1. No `AuthContext.initializeAuth`: confiar no `getSession()` local e disparar `getUser()` em background (validação não bloqueia render). Se o `getUser()` falhar depois, aí sim faz `signOut`.
2. Substituir os 3 `maybeSingle` sequenciais por **uma única RPC** `get_my_profile()` (Security Definer) que devolve `{ tipo, escritorio_id, papel, nome, cliente_id, onboarding_completo, is_admin }`. Sem mudar RLS, sem mudar schema das tabelas — só uma função read-only.
3. Remover `console.log` do contexto.

### Fase 4 — Queries mais magras (ganho: -40% a -70% payload em telas pesadas)
1. Substituir `select('*')` por listas explícitas nos hooks listados em 1.4. Crítico em `formulario_ir` (não trazer JSONBs até abrir a aba que usa).
2. `useDashboardData`: substituir a 2ª query por **view** `vw_declaracoes_kanban` (ou RPC) que já devolve `pending_docs`, `total_docs`. Continua usando o mesmo shape em TS.
3. `useClientes`: dropar o join de `usuarios` e resolver nome do contador via cache local (`contadores` já é carregado pelo próprio hook).
4. Padronizar `head: true` em queries de contagem (já feito em parte).

### Fase 5 — Realtime com debounce e canais compartilhados (ganho: -80% refetches em rajada)
1. Criar `useRealtimeInvalidate(table, filter, queryKeys)` central que faz debounce de 300ms antes de invalidar.
2. Compartilhar **um único** canal por escritório (via context) em vez de cada hook abrir o seu.
3. No `KanbanBoard`, remover `setTimeout(1500)` — invalidar imediatamente após resolver o conflito.

### Fase 6 — Render-time (ganho: INP/CLS)
1. `useMemo` em `grouped` no `KanbanBoard` e em derivações de listas grandes.
2. `React.memo` em `KanbanCard`, `ClientesTable` row, `KpiCards`, `SecaoTimeline`, itens de listas.
3. Quebrar `SecaoAnaliseCaixa`, `VisualIAFiscal`, `IntegracoesTab`, `MensagensTab` em subcomponentes — não muda UI, só reduz escopo de re-render.
4. Em formulários com `react-hook-form`, garantir `mode: 'onBlur'` (não `onChange`) e usar `Controller` apenas onde necessário.

### Fase 7 — Assets e landing (ganho: LCP)
1. `index.html`: `<link rel="preconnect">` para Supabase, fontes, Stripe.
2. Fontes via `<link rel="preload" as="font" crossorigin>` + `font-display: swap` no CSS.
3. Landing: `loading="lazy"` em tudo abaixo do fold; `fetchpriority="high"` no hero.
4. Adicionar `vite-imagetools` e converter heros para AVIF/WebP servidos com `<picture>`.
5. `LazyMotion` na landing (ver Fase 1).

### Fase 8 — Banco (ganho: query latency)
Sem alterar lógica, só observabilidade e índices:
1. Rodar `EXPLAIN ANALYZE` nas queries dos hooks `useDashboardData`, `useClientes` (com filtro `or` em `nome/cpf`), `useDeclaracao`, `useCobrancas`.
2. Conferir índices em:
   - `declaracoes(escritorio_id, ano_base, status)`
   - `clientes(escritorio_id, nome)`, `clientes(escritorio_id, cpf)`
   - `checklist_documentos(declaracao_id)`
   - `mensagens_enviadas(escritorio_id, enviado_em DESC)`
3. Se faltar algum, migration de `CREATE INDEX CONCURRENTLY` — não bloqueia e não muda comportamento.

---

## 3. Quick wins (1 hora cada, sem risco)

1. `React.lazy` em todas as rotas (Fase 1.1) — maior ganho/menor risco do projeto.
2. Defaults do `QueryClient` (Fase 2.1).
3. `LazyMotion` na landing (Fase 1.2).
4. Remover `console.log` em produção.
5. `useMemo` no `grouped` do Kanban.

---

## 4. O que **não** vou mexer

- RLS, schema de tabelas, escopo de billing, lógica de cálculo IR, fluxo de auth/onboarding, contratos das edge functions, design system, copy.
- Funcionalidades visíveis ao usuário. Toda mudança preserva comportamento atual.

---

## 5. Como medir

Antes/depois com:
- `bunx vite build --report` (tamanho de chunk).
- Lighthouse mobile (LCP, TBT, INP).
- React Query Devtools (nº de queries em sessão típica).
- `browser--performance_profile` antes e depois nas rotas chave: `/`, `/dashboard`, `/declaracoes/:id`.

Sugestão: aprovar começando pelas **Fases 1, 2 e 3** (juntas dão ~70% do ganho com risco quase zero). Depois Fase 4 (precisa revisar hooks um a um). Fases 5–8 entram em ondas.
