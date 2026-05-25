## Onda 4 — Pontos adicionais de performance

Após Ondas 1–3 (React Query stale times, índices, prefetch on hover, loading bar), ainda há ganhos sem tocar em lógica de negócio, RLS ou contratos de API.

### 1. Bundle & build (alto impacto, risco baixo)
- **`vite.config.ts`**: separar mais vendor chunks (`radix` = ~30 pacotes Radix, `dnd-kit`, `react-hook-form` + `zod`, `date-fns`, `lucide-react`).
- Ativar `esbuild.drop: ['console','debugger']` apenas em prod (remove ~centenas de `console.log` do bundle).
- Adicionar `chunkSizeWarningLimit` realista e analisar com `rollup-plugin-visualizer` (gerar relatório uma vez, não comitar).
- Confirmar que `react-pdf`, `jspdf`, `recharts`, `framer-motion` só entram via `lazy()` nas páginas que usam (auditar imports estáticos remanescentes).

### 2. Payloads do Supabase (médio impacto)
Vários hooks usam `select('*')` trazendo colunas grandes (JSONB de `formulario_ir`, `declaracoes.declaracao_extracao`, etc).
- Trocar `select('*')` por listas explícitas em hooks de listagem (não em detalhe): `useClientes`, `useCobrancas`, `useDeclaracao` (lista), `useChat` (paginação), `useMensagens`.
- Esses hooks já existem e foram tunados; aqui só reduzimos colunas — zero mudança de comportamento.

### 3. Re-renders & listas grandes (médio impacto)
- `ClientesTable`, `CobrancasTable`, `Drive`: aplicar `React.memo` nas rows e `useMemo` nos filtros/derivados. Se >200 linhas, considerar virtualização com `@tanstack/react-virtual` (já comum em projetos shadcn).
- `AuthContext` e `ThemeContext`: garantir que o `value` seja memoizado (`useMemo`) para não disparar re-render global a cada mount de página.
- Debounce nos inputs de busca (Clientes, Drive, Cobranças) — 250ms.

### 4. Realtime (baixo impacto, evita vazamento)
- Auditar `useChat`, `useNotificacoes`, kanban: garantir `removeChannel` no cleanup e um único canal por escopo (sem subscribe duplicado em StrictMode).
- Usar `filter:` no `postgres_changes` para reduzir eventos recebidos (ex.: `escritorio_id=eq.X`).

### 5. Assets & fontes (baixo impacto, melhora LCP)
- `index.html`: `<link rel="preconnect">` para Supabase URL e domínio do Stripe.
- Fontes Bricolage/DM Sans com `font-display: swap` e `preload` apenas dos pesos usados acima da dobra.
- Imagens em `public/` e `src/assets/`: converter os maiores PNGs/JPGs para WebP via `vite-imagetools` ou pré-compressão (sem alterar o uso nos componentes).

### 6. Cache cliente (médio impacto)
- Habilitar `persistQueryClient` (sessionStorage) com whitelist curta (`['escritorio','permissoes','addons']`) — sobrevive a F5 e elimina o flash de loading inicial.
- `structuralSharing: true` (já é default no v5, confirmar).

### 7. Banco (baixo–médio, depende do `pg_stat_statements`)
- Rodar análise de queries lentas (`supabase--db_health` + `analytics_query` em `postgres_logs`) e criar índices pontuais se aparecer N+1 ou seq scan em tabela grande.
- Sem alterar schema funcional — só `CREATE INDEX CONCURRENTLY` quando justificado.

### Fora de escopo (mantém estabilidade)
- Refatoração de componentes
- Mudanças em RLS, edge functions ou fluxos de billing/IRPF
- Troca de bibliotecas (shadcn, Tailwind, React Query)

### Sugestão de execução
Pacote A (bundle + payloads): itens 1 e 2 — entrega medível em segundos no TTI/INP, baixo risco.
Pacote B (UX listas + realtime): itens 3 e 4.
Pacote C (assets + cache + DB): itens 5–7.

Posso começar pelo Pacote A se aprovar, ou rodar uma análise (`db_health` + tamanho de bundle) antes para priorizar com números.
