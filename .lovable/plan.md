## Erros do CI no GitHub

O job `Verificar Lint` está quebrando porque o ESLint agora bloqueia builds com `@typescript-eslint/no-explicit-any` como erro (Fase F do hardening). Há 11 erros e 2 warnings. Plano:

### 1. Hooks chamados condicionalmente (rules-of-hooks)

**`src/pages/Declaracoes.tsx`** — o early-return do `if (!podeVerDeclaracoes)` (linhas 62-75) está antes do `useEffect` (78) e do `useQuery` (115). Mover ambos os hooks para ANTES do early-return.

**`src/pages/Cobrancas.tsx`** — mesma coisa: `useQuery` do `inter-ativo` (linha 56) precisa subir para antes do `if (!podeVerCobrancas)` (linha 40).

### 2. `any` proibido

**`src/components/configuracoes/SeletorPermissoes.tsx`** (linhas 47, 70) — tipar:
- `acc: Record<string, Permissao[]>` no reduce
- `(p: Permissao)` no map (definir interface `Permissao` com `id/categoria/nome/descricao`).

**`src/hooks/useColaboradores.ts`** (linha 149) — `onError: (error: Error)` (ou `unknown` + narrow).

**`supabase/functions/ia-fiscal/index.ts`** (linhas 308, 342, 343):
- `repairTruncatedJson(raw: string): unknown`
- `saveAnalysis(supabase: SupabaseClient, ...)` importando o tipo de `@supabase/supabase-js`
- `let jsonResult: unknown = null`

### 3. Outros erros

**`src/components/declaracao/VisualIAFiscal.tsx`** linha 117 — trocar `let textual` por `const textual` (não é reatribuído).

**`src/components/formulario-ir/StepDadosPessoais.tsx`** linha 398 — remover `!!`: `Chave: {data.chave_pix_cliente ? clientCPF : 'Não selecionada'}`.

### 4. Warnings (não bloqueiam, mas vou limpar)

- **`IntegracoesTab.tsx`** linha 400 — remover `toast` das deps do `useEffect`.
- **`NotificacoesTab.tsx`** linha 41 — envolver `CANAIS` em `useMemo([isWhatsAppConnected])`.

### Validação

Rodar `bun run lint` localmente até passar com 0 erros. Os testes unitários e E2E já passam, então o CI deve ficar verde após esses ajustes.

### Arquivos alterados

- `src/pages/Declaracoes.tsx`
- `src/pages/Cobrancas.tsx`
- `src/components/configuracoes/SeletorPermissoes.tsx`
- `src/hooks/useColaboradores.ts`
- `supabase/functions/ia-fiscal/index.ts`
- `src/components/declaracao/VisualIAFiscal.tsx`
- `src/components/formulario-ir/StepDadosPessoais.tsx`
- `src/components/configuracoes/IntegracoesTab.tsx`
- `src/components/configuracoes/NotificacoesTab.tsx`