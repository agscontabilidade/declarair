
# Plano definitivo: zerar `any`, blindar o CI

## Diagnóstico (verificado agora, não suposição)

- `eslint.config.js` já está com `no-explicit-any: "warn"` (Fase 1 feita).
- `bun run lint` retorna **0 erros + 213 warnings**, exit 0.
- `package.json` tem `"lint": "eslint . --max-warnings 213"` — **margem zero**. Qualquer novo `any` quebra o CI.
- Distribuição: 69 warnings em `src/`, 14 em `supabase/functions/` (Stripe, Inter, PDF — alto risco financeiro).
- `ci.yml` ainda usa `actions/checkout@v4` (Node 20, deprecação anunciada para 2026 — não bloqueia hoje).
- Não existe `src/types/` centralizado — tipagem está inline e duplicada.

A análise do GPT identifica corretamente o sintoma estrutural (falta de domínio tipado), mas a "solução rápida" dele já foi aplicada. O caminho agora é eliminar a dívida, não adiá-la.

## Estratégia: ratchet decrescente

Em vez de um big-bang arriscado em produção, vamos zerar warnings em **lotes priorizados por risco**, baixando `--max-warnings` a cada lote. Isso garante que:
- O CI nunca regride (lote concluído = teto novo, mais baixo).
- Bugs financeiros silenciosos são eliminados primeiro.
- A revisão humana fica gerenciável (lotes de 30–50 warnings).

## Fases

### Fase A — Tipagem central (fundação)
Criar `src/types/` com contratos compartilhados, alimentados por `src/integrations/supabase/types.ts` (gerado pelo Supabase) e Zod:

```text
src/types/
  cliente.ts        // Cliente, ClienteComContador, StatusOnboarding
  declaracao.ts     // Declaracao, StatusDeclaracao, TipoResultado
  cobranca.ts       // Cobranca, StatusCobranca, payloads Inter/Stripe
  formulario-ir.ts  // FormularioIR + JSONB inferidos de Zod schemas
  pdf.ts            // payloads de processar-pdf-declaracao
  stripe.ts         // re-export de Stripe.* + tipos de webhook locais
  inter.ts          // contratos da API Inter (token, boleto, webhook)
  index.ts          // barrel
```

Padrão: derivar de `Database["public"]["Tables"][...]["Row"]` quando possível; usar `z.infer<typeof schema>` para JSONB.

### Fase B — Backend financeiro (14 warnings, prioridade máxima)
Edge functions onde `any` é risco direto de bug financeiro:

- `supabase/functions/stripe-webhook/index.ts` — usar `Stripe.Event`, `Stripe.Invoice`, `Stripe.Subscription`.
- `supabase/functions/billing-service/index.ts`
- `supabase/functions/stripe-checkout/index.ts`
- `supabase/functions/inter-*` (boleto, webhook, token mTLS)
- `supabase/functions/processar-pdf-declaracao/index.ts` — tipar payload de OCR/extração.

Ao final: `--max-warnings 199`.

### Fase C — Frontend de domínio crítico (~30 warnings)
Componentes que tocam dinheiro, status legal e dados sensíveis:

- `src/pages/Declaracoes.tsx`, `src/pages/Cobrancas.tsx`, `src/pages/Clientes.tsx`
- `src/components/declaracoes/*` (incluindo `AnexarDeclaracaoButton.tsx`)
- `src/components/cobrancas/*`
- Hooks: `useDashboardData`, `useDeclaracoes`, `useCobrancas`

Ao final: `--max-warnings ~170`.

### Fase D — Frontend operacional (~25 warnings)
Mensagens, templates, comunicação, configurações, capa PDF.
Ao final: `--max-warnings ~145`.

### Fase E — Frontend auxiliar e UI (~14 warnings)
Componentes de UI, formulários secundários, utilitários.
Ao final: `--max-warnings 0`.

### Fase F — Hardening permanente
1. `eslint.config.js`: voltar `no-explicit-any` para `"error"`.
2. `package.json`: remover `--max-warnings`, adicionar:
   - `"typecheck": "tsc --noEmit"`
   - `"lint": "eslint ."`
3. `.github/workflows/ci.yml`:
   - Adicionar step `bun run typecheck` antes de `lint`.
   - Atualizar `actions/checkout@v4` → manter (já é v4, ok). Adicionar `actions/setup-node@v4` só se necessário.
   - Adicionar cache de dependências do bun para acelerar.
4. Documentar em `.lovable/plan.md` que `any` é proibido — usar `unknown` + narrowing ou tipo concreto.

## Detalhes técnicos

**Substituições padrão:**
- `(payload: any)` → `(payload: unknown)` + Zod parse, ou tipo do domínio.
- `catch (e: any)` → `catch (e: unknown)` + `e instanceof Error ? e.message : String(e)`.
- `Record<string, any>` JSONB → `z.infer<typeof schema>` da Fase A.
- Eventos Stripe: `Stripe.Event` + discriminated union em `event.type`.
- Respostas Supabase: usar tipos gerados, nunca `any` em `.from(...).select()`.

**Riscos e mitigações:**
- *Risco:* mudança de tipo expõe bug latente (ex: campo opcional acessado sem guard).
- *Mitigação:* cada fase é um commit separado; rodar `bun run test` + revisão visual no preview entre fases.
- *Risco:* tipos do Supabase desatualizados quebram Fase A.
- *Mitigação:* `src/integrations/supabase/types.ts` é regenerado automaticamente; validar antes da Fase A começar.

**Não tocar:**
- `src/integrations/supabase/client.ts` e `types.ts` (auto-gerados).
- Schema do banco (produção estável).
- RLS policies.

## Entregável final

- 0 errors, 0 warnings, `no-explicit-any: error`.
- `tsc --noEmit` rodando no CI.
- `src/types/` como única fonte de verdade dos contratos de domínio.
- Pipeline GitHub Actions verde e à prova de regressões.

## Execução proposta

Começo pela **Fase A + Fase B** num único commit (fundação + backend financeiro), depois cada fase seguinte em commits separados para revisão incremental. Aprove e eu sigo.
