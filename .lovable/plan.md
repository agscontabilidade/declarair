## Auditoria — o ChatGPT está certo?

**Sim, no diagnóstico raiz: está correto.** Reproduzi `bun run lint` localmente e o pipeline quebra exatamente pelo motivo descrito. Mas ele errou em alguns pontos importantes que mudam o plano:

### Confirmado
- O CI executa `bun run lint` (workflow `.github/workflows/ci.yml`, etapa "Verificar Lint").
- A regra `@typescript-eslint/no-explicit-any` está ativa via `tseslint.configs.recommended` em `eslint.config.js`.
- ESLint retorna exit code ≠ 0 → workflow inteiro quebra antes de testes/build.

### Onde o ChatGPT errou
1. **Não é só `no-explicit-any`.** O total real é **258 problemas (237 erros, 21 warnings)** distribuídos em **88 arquivos**, com 6 regras diferentes:
   - 221 × `@typescript-eslint/no-explicit-any`
   - 15 × `react-refresh/only-export-components` (warnings)
   - 12 × `prefer-const`
   - 6 × `react-hooks/exhaustive-deps` (warnings)
   - 2 × `@typescript-eslint/no-empty-object-type`
   - 1 × `@typescript-eslint/no-require-imports` (`tailwind.config.ts`)

2. **A maior concentração de `any` está nas Edge Functions Supabase** (`stripe-checkout`, `stripe-webhook`, `billing-service`, `ia-fiscal`, `processar-pdf-declaracao`, `auth-email-hook`, `send-transactional-email`), não só nos componentes do print. Cerca de ~95 dos 221 `any` estão em `supabase/functions/**`.

3. **Os arquivos do print do usuário (ReportBugModal, AbaCobrancas, ClienteModal, etc.) realmente têm `any`**, mas representam uma fração menor do problema total.

4. **A config NÃO foi "ativada recentemente".** O `eslint.config.js` sempre estendeu `tseslint.configs.recommended` — o que mudou foi a quantidade de código com `any` crescer e ultrapassar o limiar de tolerância (e provavelmente o CI passou a rodar `lint` como gate obrigatório agora).

5. **A sugestão dele de jogar tudo para `unknown` é perigosa**: muitos casos no nosso código são tipos do Supabase/Stripe que já têm tipagem própria disponível (`Database` em `src/integrations/supabase/types.ts`, `Stripe.Event`, etc.). Trocar por `unknown` cria dívida em vez de resolver.

---

## Plano de resolução em 4 fases

### Fase 1 — Destravar CI imediatamente (sem comprometer qualidade futura)

Ajustar `eslint.config.js` para:
- Manter `no-explicit-any` ativo, mas como **`warn`** temporariamente (CI volta a passar).
- Corrigir os 12 `prefer-const` (são auto-fixáveis com `--fix`, custo zero).
- Corrigir o único `no-require-imports` em `tailwind.config.ts` (trocar `require("tailwindcss-animate")` por `import`).
- Corrigir os 2 `no-empty-object-type` (interfaces vazias em `command.tsx` e `textarea.tsx` do shadcn — trocar por `type X = ComponentProps<...>`).
- Manter `react-refresh` e `exhaustive-deps` como `warn` (já são warnings, não quebram CI).

Adicionar um **teto duro** ao lint via flag `--max-warnings` configurável: começar com `--max-warnings 250` e ir baixando a cada PR. Isso impede que o problema volte a crescer.

### Fase 2 — Eliminar `any` nas Edge Functions (maior ganho)

Estes são os hotspots e têm tipos prontos disponíveis:

- **`stripe-checkout`, `stripe-webhook`, `billing-service`**: usar tipos oficiais `Stripe.Checkout.Session`, `Stripe.Event`, `Stripe.Subscription`, `Stripe.Invoice` do pacote `stripe`. Substitui ~95 ocorrências.
- **`ia-fiscal`, `processar-pdf-declaracao`**: criar interfaces locais para o payload da Lovable AI (`LovableAIResponse`, `ExtracaoFiscal`) em um `_shared/types.ts`.
- **`auth-email-hook`, `send-transactional-email`**: tipar payloads do Auth Hook do Supabase (`AuthHookPayload`) e do registry de templates.

### Fase 3 — Eliminar `any` no frontend

Atacar por categoria:

- **Componentes de listagem (`AbaCobrancas`, `CobrancasTable`, `ClienteModal`, etc.)**: derivar tipos de `Database['public']['Tables']['<tabela>']['Row']` que já existe em `src/integrations/supabase/types.ts`. Criar `src/types/domain.ts` reexportando aliases legíveis (`Cobranca`, `Cliente`, `Declaracao`).
- **Hooks (`useClientes`, `useCobrancas`, `useDeclaracao`)**: tipar retornos com esses aliases.
- **Handlers de form (React Hook Form + Zod)**: usar `z.infer<typeof schema>` em vez de `any` nos `onSubmit`.
- **Eventos React**: trocar `e: any` por `React.ChangeEvent<HTMLInputElement>` etc.

Estratégia: corrigir em lotes de ~20 arquivos por PR para revisão viável.

### Fase 4 — Endurecer regra e prevenir regressão

Quando contagem de `any` chegar a zero:
- Voltar `@typescript-eslint/no-explicit-any` para **`error`**.
- Adicionar `--max-warnings 0` no script `lint` do `package.json`.
- Adicionar regra `@typescript-eslint/no-unsafe-*` (gradual) para garantir que `unknown` seja tratado com narrowing.
- Ativar `tsc --noEmit` como step separado no CI (hoje só roda lint, não typecheck — `tsconfig.json` tem `noImplicitAny: false` e `strictNullChecks: false`, o que mascara muito problema).
- Documentar no `README.md` a política: PRs novos não podem introduzir `any`.

---

## Detalhes técnicos

**Por que não desligar a regra (sugestão 3 do ChatGPT) é má ideia:** desligar `no-explicit-any` permite a dívida crescer indefinidamente. A Fase 1 (rebaixar para `warn` + `--max-warnings`) preserva visibilidade e cria um cliquet (ratchet) descendente.

**Por que não usar `unknown` indiscriminadamente (sugestão 2):** força narrowing em toda chamada subsequente, gera ruído. Só vale quando o tipo é genuinamente desconhecido (ex.: parsing JSON externo). Para Supabase/Stripe temos tipos oficiais.

**Por que tipar Edge Functions primeiro:** lidam com webhook payloads e transações financeiras. `any` aqui é risco real de bug em produção, não só estético.

**Custo estimado:**
- Fase 1: ~15 min (1 PR pequeno).
- Fase 2: ~2-3h (1 PR médio focado em Edge Functions).
- Fase 3: ~4-6h (3-4 PRs em lotes).
- Fase 4: ~30 min (config + doc).

---

## O que NÃO está no plano

- Não vou tocar em `src/integrations/supabase/types.ts` (auto-gerado).
- Não vou tocar em `src/components/ui/**` além das 2 interfaces vazias (shadcn pristine).
- Não vou alterar lógica de negócio — só tipagem.

Aprove para eu executar a Fase 1 (destravar CI hoje). As fases seguintes podem ser feitas em PRs separados depois, conforme prioridade.