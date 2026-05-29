## Diagnóstico da lentidão (urgente)

Não é o banco — o Lovable Cloud responde normal (3 conexões ativas, sem locks). O problema é **cascata de awaits no client** entre login e renderização do Dashboard.

### Tempo real observado
Da sua última sessão (network logs): **23s entre abrir `/dashboard` e o spinner sumir**, com cada request pequeno chegando em 200 OK rápido — o tempo é gasto **esperando o anterior terminar**, não no servidor.

### Cadeia que está rodando hoje (sequencial)

```text
ProtectedRoute (loading)
  └── AuthContext.loadProfile          ← 3 awaits sequenciais
       1. SELECT user_roles            (sempre roda, mesmo p/ contador)
       2. SELECT usuarios
       3. SELECT escritorios.onboarding_completo
                ↓
BillingGate (loading)                  ← bloqueia Dashboard com spinner próprio
  └── useBillingStatus.queryFn         ← 3 awaits sequenciais
       1. SELECT assinaturas
       2. SELECT escritorios.plano     (duplicado abaixo)
       3. SELECT escritorio_addons     (duplicado abaixo)
                ↓
Dashboard mount
  ├── useUsageStatus      → SELECT escritorios.plano,declaracoes_utilizadas  (3ª vez)
  ├── useBilling          → SELECT escritorios.plano + SELECT escritorio_addons (4ª e 2ª vez)
  ├── dashboard_kpis RPC  → 187 ms
  └── dashboard-declaracoes SELECT com joins
```

Total: ~6–9 requests em série até a tela aparecer, sendo que **5 deles eram paralelizáveis** e **3 são duplicatas** da mesma linha de `escritorios` + `escritorio_addons`.

Também: o canal realtime de `declaracoes` invalida `dashboard-kpis` e `dashboard-declaracoes` em **qualquer mudança de coluna** (até `observacoes_cliente_lida_em`), refetchando agressivo — `dashboard_kpis` rodou 265× em pouco tempo.

---

## O que mudar (somente performance, sem mexer em regras/RLS/UI)

### 1. `src/contexts/AuthContext.tsx` — paralelizar `loadProfile`
- Disparar `user_roles`, `usuarios` e (quando tiver `escritorio_id`) `escritorios.onboarding_completo` em **`Promise.all`** em vez de aguardar um por um.
- Para o caso comum (contador), economiza ~2 round-trips.

### 2. `src/hooks/useBillingStatus.ts` — paralelizar as 3 leituras
- Trocar os 3 `await` por `Promise.all([assinaturas, escritorios.plano, escritorio_addons])`. As três são independentes.

### 3. Deduplicar `escritorios.plano` / `escritorio_addons`
- `useBilling`, `useBillingStatus` e `useUsageStatus` leem as **mesmas linhas** com chaves diferentes no React Query, sem dedup.
- Unificar em **dois hooks-fonte** com `staleTime` longo:
  - `useEscritorioBilling()` → `escritorios { plano, declaracoes_utilizadas, limite_declaracoes, onboarding_completo }` — chave `['escritorio-billing', escritorioId]`, `staleTime: 5 min`.
  - `useEscritorioAddons()` → `escritorio_addons` ativos — chave `['escritorio-addons', escritorioId]`, `staleTime: 5 min`.
- `useBilling`, `useBillingStatus`, `useUsageStatus` passam a **consumir** esses dois hooks (mantêm a mesma API externa para não quebrar nada). A query `onboarding_completo` também pode vir daí, eliminando o 3º await do `loadProfile`.

### 4. `BillingGate` — não bloquear o Dashboard inteiro
- Hoje, enquanto `useBillingStatus.isLoading`, o `BillingGate` renderiza um spinner e **esconde toda a página**. Só precisamos bloquear se `isBlocked === true`.
- Mudar para: renderizar `children` direto; só redirecionar quando `loading=false && isBlocked`. Como `isBlocked` exige `subStatus === 'overdue'/'blocked'` + `plano !== 'gratuito'`, o falso-positivo durante o carregamento já não acontece (padrão é `free`/sem flag). O Dashboard começa a renderizar em paralelo com a checagem de billing.

### 5. `src/hooks/useDashboardData.ts` — invalidação realtime mais cirúrgica
- Hoje qualquer `UPDATE` em `declaracoes` invalida `dashboard-kpis` e `dashboard-declaracoes`. Manter a invalidação de `dashboard-declaracoes` (a lista precisa refletir mudanças), mas invalidar `dashboard-kpis` **só em `INSERT`/`DELETE` ou quando `payload.new.status !== payload.old.status`** — que são os únicos eventos que mexem nos KPIs. Reduz fortemente os 265 refetches do RPC.

### Fora de escopo (não mexer agora)
- Não alterar RLS, schemas, edge functions, nem comportamento de billing/limites.
- Não trocar bibliotecas. Não tocar Sentry, Stripe, Inter, WhatsApp.
- Não mexer no PdfViewer, Cobranças (já consertado) nem em /declaracoes.

---

## Resultado esperado
- Tempo até Dashboard interativo: de **~20–25 s** para **~3–5 s** em rede típica.
- Carga no DB do RPC `dashboard_kpis` cai ~70 % (menos refetches por realtime).
- Sem mudança visual nem de regras de negócio.

Confirmo e parto para implementação?
