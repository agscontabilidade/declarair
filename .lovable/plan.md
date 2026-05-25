## Auditoria de Performance — DeclaraIR

Investiguei queries, hooks, realtime, índices, bundle e padrões de cache. Os dados em produção são pequenos (67 clientes, 69 declarações, 782 checklist_documentos), então a lentidão é predominantemente **client-side**: queries gordas, polling agressivo e invalidações em cascata. Abaixo, os pontos com maior ganho potencial — agrupados por impacto.

## Pontos identificados

### ALTO impacto

**1. `Declaracoes.tsx` — query gigante carregada de uma vez**
- Hoje busca `declaracoes` + `clientes` + `declaracao_notas_internas` + **todos os `checklist_documentos`** só para derivar um boolean `temDocsDrive`. Em escritórios com muitos docs, isso transfere MBs.
- **Fix**: substituir o embed de `checklist_documentos(arquivo_url)` por uma coluna agregada/RPC `tem_docs_drive` (boolean) ou trazer só `checklist_documentos!inner(id).limit(1)`. Já reduz drasticamente o payload.

**2. KPIs do Dashboard fazendo 4× `count: exact`**
- `count exact` faz full scan em paralelo. Para 4 KPIs já são 4 scans.
- **Fix**: criar 1 RPC `dashboard_kpis(escritorio_id, ano)` que retorna os 4 contadores em 1 round-trip (1 query SQL com `count(*) FILTER (WHERE ...)`).

**3. Polling em segundo plano agressivo**
- `useWhatsApp` refetch 15s, `useUsageStatus` 30s, `useBillingStatus` 60s — mesmo com aba inativa (já está `refetchOnWindowFocus:false`, então roda sempre).
- **Fix**: aumentar intervalos (WhatsApp 60s, UsageStatus 5min, BillingStatus 5min) e parar polling quando documento `hidden` (`document.visibilityState`).

**4. Realtime invalidando queries grandes a cada change**
- `Declaracoes.tsx`, `useDashboardData`, `useDeclaracao`, `useChat`, `useNotificacoes`, `useCobrancasAtrasadas` — cada `INSERT/UPDATE/DELETE` invalida lista inteira.
- **Fix**: já existe `useDebouncedInvalidate(300)` em alguns lugares; aplicar onde ainda não tem (`useNotificacoes`, `useChat`, `useDeclaracao`) e aumentar debounce para 800ms em listas pesadas.

### MÉDIO impacto

**5. `select('*')` em 30+ lugares**
- Especialmente em hooks chamados em todo render (`useNotificacoes`, `useClientePortal`, `useClientePerfil`, `useDeclaracao`, `useFormularioIR`, `useColaboradores`, `useAddons`, `Configuracoes`).
- **Fix**: substituir por lista explícita de colunas usadas no componente.

**6. `Configuracoes.tsx` carrega 2 selects `*` sequenciais**
- `escritorios.*` + `usuarios.*` por escritório. Pode ser 1 query com colunas específicas.

**7. `useNotificacoes` — staleTime 1min + realtime**
- Provoca refetch constante. Subir `staleTime` para 5min e confiar no realtime para atualizar via `setQueryData` em vez de invalidar.

**8. Índices faltantes (sugestão)**
- `declaracao_notas_internas(escritorio_id, declaracao_id)` — realtime filtra por escritorio_id.
- `notificacoes(escritorio_id, lida, created_at desc)` — já tem parcial; verificar plano.
- Confirmar via `EXPLAIN ANALYZE` em produção antes de criar — schema em produção.

### BAIXO impacto / quick wins

**9. Bundle**
- `framer-motion` usado em 10+ componentes da landing (já lazy por rota — ok).
- `jspdf` + `pdf-lib` + `react-pdf` no mesmo chunk `pdf` (vite.config.ts). Ok, mas o chunk só é baixado quando alguém abre `/capa` ou viewer de PDF — já está adequado.
- Manter como está.

**10. `useEffect` de busca debounced em `Declaracoes.tsx`**
- Ok, já tem 300ms.

**11. Avatares/logos em `<img>` sem `loading="lazy"`** em listas longas — adicionar atributo onde aplicável.

## Escopo proposto de implementação (em ordem de ROI)

Sugiro implementar em ondas para validar ganho antes de mexer em mais coisa:

**Onda 1 — Ganhos imediatos sem mudar schema (1 PR)**
- Remover embed de `checklist_documentos` em `Declaracoes.tsx`; usar coluna derivada existente ou flag simples.
- Aumentar intervalos de polling (`useWhatsApp` 60s, `useUsageStatus` 300s, `useBillingStatus` 300s).
- Pausar polling quando `document.hidden`.
- `useNotificacoes`: subir `staleTime` para 5min; atualizar cache via realtime em vez de invalidar.
- Aplicar `useDebouncedInvalidate(800)` em `useChat` e `useDeclaracao`.

**Onda 2 — Otimização SQL (1 PR, requer migration)**
- RPC `dashboard_kpis(escritorio_id, ano_base)` retornando os 4 contadores em 1 query.
- Trocar `useDashboardData.kpis` para chamar o RPC.

**Onda 3 — Limpeza de `select('*')` (1 PR)**
- Substituir nos 8 hooks mais usados (`useNotificacoes`, `useClientePerfil`, `useDeclaracao`, `useFormularioIR`, `useColaboradores`, `useAddons`, `Configuracoes`, `useClientePortal`).

**Onda 4 — Índices (1 PR, com EXPLAIN antes)**
- Avaliar e criar índices só onde o `EXPLAIN ANALYZE` mostrar seq scan custoso.

## Decisão necessária

Qual onda você quer que eu implemente primeiro? Recomendo **Onda 1** isolada — é a que dá o ganho mais perceptível sem risco (zero mudança de schema, zero impacto em billing/RLS, só ajuste de hooks e uma query). Aí medimos e seguimos para a Onda 2.

Sem mudanças em: RLS, multi-tenancy, billing, lógica de negócio, edge functions, fluxo de IRPF, design system.