# Otimização de performance — Área do Cliente

Análise abrange `ClienteDashboard`, `ClienteDocumentos`, `ClienteFormulario`, `ClienteLayout`, `useClientePortal`, `useFormularioIR`, `useChat`, `ChatFlutuante`, `StatusStepper`, `RelacaoDocumentosModal`.

## Diagnóstico (gargalos confirmados)

1. **Bundle inicial inflado com ~1,35 MB de imagens do tutorial e-CAC.** `ClienteDashboard.tsx` faz 8 `import passoX from '@/assets/ecac/passo-X.jpg'` (cada uma 130–190 KB). Todas entram no chunk da rota, mesmo sem o cliente abrir o modal "Ver Passo a Passo".
2. **Array `tutorialSteps` (10 itens, com JSX rico embutido) recriado a cada render** do `ClienteDashboard`. Roda em cada `setState` (ex.: digitar mensagem no chat também invalida o `unreadCount` e força re-render).
3. **`SecaoChat` carregado eager** dentro de `ChatFlutuante.tsx`. O componente do chat completo (com `useChat`, sub-queries, realtime, lista de mensagens) entra no bundle mesmo se o cliente nunca abrir o chat.
4. **`RelacaoDocumentosModal` (modal pesado com Accordion e ~150 linhas de conteúdo)** é importado eager em `ClienteDocumentos.tsx`, mesmo só sendo aberto sob clique.
5. **`useClientePortal` recalcula `statusStep`, `pendentes`, `stepTimestamps`, `firstDocRecebido`, `lastActivityFor` a cada render** dos consumers — sem `useMemo`. `ClienteDashboard`, `ClienteFormulario` e `ClienteDocumentos` consomem esse hook em paralelo, multiplicando o trabalho.
6. **Duplicação de query para a declaração ativa.** `useClientePortal` usa `['cliente-declaracao', clienteId]` e `useFormularioIR` usa `['cliente-declaracao-form', clienteId]` consultando praticamente os mesmos campos da mesma linha — duas requisições à `declaracoes` por sessão.
7. **`useChat` faz `select('*')` sem `limit`** em `mensagens_chat` por `declaracao_id`. Para uma declaração com histórico, paga o custo inteiro só para calcular `unreadCount`.
8. **Query de `atividades` em `useClientePortal`** só serve para timestamps do stepper — paga custo sempre, mesmo em telas que não mostram o stepper (`ClienteDocumentos`, `ClienteFormulario`).

## Plano de correções (todas frontend / Vite — sem schema, sem RLS, sem edge)

### 1. `src/pages/cliente/ClienteDashboard.tsx`
- Extrair o **conteúdo completo do tutorial e-CAC** (8 imports de imagem + `tutorialSteps` + JSX de cada passo + UI do `Dialog`) para um novo componente `EcacTutorialDialog.tsx`.
- Importar esse componente via `lazy(() => import(...))` em `ClienteDashboard`, envolto em `<Suspense fallback={null}>`. Resultado: as 8 imagens e todo o JSX dos passos saem do chunk do dashboard.
- No `Dashboard`, manter apenas o `Button` "Ver Passo a Passo" que faz `setOpen(true)`; o `EcacTutorialDialog` só monta quando aberto.
- Garantir `loading="lazy"` + `decoding="async"` nas `<img>` do tutorial (já existe `lazy`; só adicionar `decoding`).

### 2. `src/components/cliente-portal/ChatFlutuante.tsx`
- Trocar `import { SecaoChat }` por `const SecaoChat = lazy(() => import('@/components/declaracao/SecaoChat').then(m => ({ default: m.SecaoChat })))`.
- Renderizar `<SecaoChat />` dentro de `<Suspense fallback={...skeleton minimal...}>` somente quando `open === true`. Resultado: chunk do `SecaoChat` + suas deps só baixa ao abrir.

### 3. `src/pages/cliente/ClienteDocumentos.tsx`
- Converter `RelacaoDocumentosModal` para `lazy(() => import('@/components/cliente-portal/RelacaoDocumentosModal').then(m => ({ default: m.RelacaoDocumentosModal })))`.
- Montar apenas quando `relacaoModalOpen === true` (`{relacaoModalOpen && <Suspense fallback={null}><RelacaoDocumentosModal ... /></Suspense>}`).

### 4. `src/hooks/useClientePortal.ts`
- Envolver os derivados em `useMemo`: `statusStep`, `pendentes`, `progressoFormulario`, `firstDocRecebido`, `stepTimestamps`, e a função `lastActivityFor`. Dependências corretas (`declaracao`, `checklist`, `formulario`, `atividades`).
- Tornar a query de **atividades opcional** via parâmetro: `useClientePortal({ includeTimestamps?: boolean } = {})`. Quando `false`, não habilita a 4ª query.
  - `ClienteDashboard` chama com `{ includeTimestamps: true }`.
  - `ClienteDocumentos` e `ClienteFormulario` chamam sem o flag → economizam 1 query por carregamento dessas telas.

### 5. Unificar query da declaração ativa entre `useClientePortal` e `useFormularioIR`
- Padronizar a `queryKey` para `['cliente-declaracao-ativa', clienteId]` e usar **a mesma `queryFn`** (selecionando o superset dos campos necessários: id, ano_base, escritorio_id, cliente_id, status, status_documentos, tipo_resultado, valor_resultado, numero_recibo, data_transmissao, forma_tributacao, ultima_atualizacao_status, created_at, version).
- `useFormularioIR` passa a reaproveitar o cache (segundo `useQuery` na mesma key vira no-op — fetch único por sessão).
- Atualizar os `invalidateQueries` em `ClienteDocumentos` e `useFormularioIR` para a nova key (e remover a key antiga `cliente-declaracao-form`).

### 6. `src/hooks/useChat.ts`
- Adicionar `.limit(200)` (e `order created_at desc` na query, depois `reverse` no client) para limitar payload e parsing. Mantém UX: 200 mensagens é mais que suficiente para o portal do cliente.
- Manter o `setQueryData` do realtime — INSERTs continuam aparecendo no topo.

### 7. Otimização de assets `src/assets/ecac/`
- Manter os arquivos onde estão; o ganho real vem do passo 1 (sair do chunk inicial). Apenas garantir `decoding="async"` nas `<img>` e o `loading="lazy"` que já existe.
- (Opcional, não bloqueante) Em uma iteração futura, converter para WebP — fora do escopo desta task para evitar reprocessamento de imagens em produção.

## Fora de escopo
- Schema/RLS/edge functions. Tudo é frontend/cache.
- Refatorar `SecaoChat` em si (consumido pelo contador também).
- Conversão das imagens para WebP/AVIF.
- Mudar o layout/visual de qualquer tela.

## Impacto esperado
- Chunk inicial da rota `/cliente/dashboard` cai de ~1,5 MB de imagens estáticas para ~0 KB — abertura visivelmente mais rápida em 3G/4G.
- Chunk de `ChatFlutuante` deixa de arrastar `SecaoChat` e suas dependências para clientes que não abrem o chat.
- 1 query a menos em `/cliente/documentos` e `/cliente/formulario` (sem `atividades`).
- 1 round-trip a menos no `/cliente/formulario` (declaração ativa reaproveitada do cache do dashboard).
- Re-renders de `ClienteDashboard` deixam de recriar 10 nodes de JSX por keystroke/state-change ao memoizar derivados e isolar o tutorial.
- Query de chat com volume limitado evita parse de históricos longos.

## Validação após implementar
- Build sem erros e tipos verdes.
- Manualmente: `/cliente/dashboard` carrega; abrir o modal e-CAC ainda funciona (com pequeno spinner do Suspense na 1ª abertura).
- Manualmente: `/cliente/documentos` abre o modal "Ver lista de documentos" normalmente.
- `ChatFlutuante`: badge de não lidas continua funcionando; abrir o chat ainda renderiza a `SecaoChat`.
- `/cliente/formulario`: auto-save, finalizar e checklist continuam idênticos.
