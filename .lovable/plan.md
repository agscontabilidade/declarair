## Otimizações de Performance — Alternativas Seguras (Zero Risco)

### Objetivo
Reduzir requisições desnecessárias ao banco e eliminar flashes de loading em tabelas grandes, sem alterar lógica de negócio, sem virtualização e sem persistir dados sensíveis em storage.

### Contexto Atual
O `QueryClient` global já possui `refetchOnWindowFocus: false`, `retry: 1` e `staleTime: 60s`. Estamos em temporada IRPF — estabilidade é prioridade absoluta.

### Mudanças Propostas

#### 1. `QueryClient` global (`src/App.tsx`)
- **Aumentar `staleTime` de 60s para 300s (5 min)**  
  Dados contábeis (clientes, declarações, cobranças) raramente mudam a cada minuto. Isso reduz re-fetches em ~80% nas navegações entre páginas.
- **Adicionar `retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)`**  
  Em falhas transitórias de rede, evita spam de requisições em sequência rápida.

#### 2. Hooks de lista grande (`useClientes`, `useCobrancas`, `useDeclaracao`, `useChat`, `useMensagens`)
- **Adicionar `placeholderData: keepPreviousData`** em queries paginadas/filtradas.  
  Quando o usuário troca página, filtro ou aba, a lista anterior permanece visível enquanto os novos dados carregam — elimina o flash de tela em branco e o spinner. Sem risco de dados corrompidos.

#### 3. `useBillingStatus` e hooks de metadados estáticos
- **Aumentar `staleTime` para 10 min (`600_000`)** em hooks que carregam plano, limites e addons.  
  Esses dados mudam apenas após ação explícita do usuário (upgrade, compra de add-on).

#### 4. Hook `useDebouncedInvalidate` (já existe)
- **Verificar se está sendo usado corretamente** em formulários com auto-save ou busca em tempo real para evitar invalidações excessivas.

### O que NÃO será feito (garantia de zero risco)
- Nenhuma virtualização de tabela.
- Nenhuma persistência de cache em `localStorage`/`sessionStorage`.
- Nenhuma mudança em RLS, auth, ou regras de negócio.
- Nenhuma remoção de colunas em `select('*')`.

### Resultado Esperado
- Menos requisições ao backend nas navegações comuns.
- Experiência mais fluida em tabelas e kanban.
- Nenhuma mudança visual ou funcional perceptível além da velocidade.