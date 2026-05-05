# Melhorar agente de Análise de Caixa com prompts especialistas

## Modelo atual vs recomendado

**Atual:** `google/gemini-2.5-flash` para tudo (incluindo análise de caixa com PDF anexo).

**Problema:** Flash é fraco em (a) leitura precisa de PDFs longos, (b) cálculos numéricos encadeados (origens × aplicações), (c) raciocínio jurídico-fiscal. Daí as análises rasas e contas erradas que você vê.

**Mudança:** roteamento por tipo de análise:

| Tipo | Modelo novo | Por quê |
|---|---|---|
| `analise_caixa` (PDF + cálculo) | `google/gemini-2.5-pro` | Multimodal forte, raciocínio numérico, contexto longo |
| `riscos` (malha fina) | `google/gemini-2.5-pro` | Diagnóstico técnico com base legal |
| `analise` (geral) | `google/gemini-2.5-pro` | Recomendação Simples × Completa precisa |
| `deducoes` (sugestões) | `google/gemini-2.5-flash` | Tarefa leve, mantém custo baixo |

Pro custa mais por chamada, mas a análise de caixa é gerada poucas vezes por declaração — o ganho de qualidade compensa.

## Onde os prompts entram

Único arquivo: **`supabase/functions/ia-fiscal/index.ts`**, função `getSystemPrompt(tipo)`. Vou reescrever cada bloco usando o conhecimento dos 5 especialistas que você enviou:

- **44-malha-fina-pf-diagnostico** → alimenta `tipo="riscos"` (códigos 010/015/050/070, decisão retificar × defender, DARF 0211 com Selic+multa)
- **48-irpf-declaracao-completa** → alimenta `tipo="analise"` (Simples × Completa com tabela 2026, fichas obrigatórias, checklist 16 documentos)
- **49-irpf-ganho-capital** → seção dentro de `analise_caixa` e `riscos` (alíquotas progressivas Lei 13.259/16, isenções R$ 440k / reinvestimento 180d, redutores Lei 11.196)
- **50-irpf-aluguel-carne-leao** → seção dentro de `analise_caixa` e `riscos` (PF×PJ, DARF 0190, deduções IPTU/condomínio)
- **51-irpf-investimentos-bolsa** → seção dentro de `analise_caixa` e `riscos` (swing/day/FII/cripto, isenções R$ 20k e R$ 35k, DARFs 6015/4600)

## O que muda em cada prompt

### `analise_caixa` (o principal — onde a queixa atual está)

Estrutura nova:

1. **Identificação** (CPF, ano-base, fontes detectadas no PDF)
2. **Tabela de Origens × Aplicações** (com valores em R$ extraídos linha-a-linha do PDF — citar ficha)
   - Origens: rendimentos tributáveis + isentos + tributação exclusiva + alienações + dívidas contraídas
   - Aplicações: Δ patrimônio + despesas dedutíveis + IR pago + dívidas quitadas
   - Saldo com sinalização explícita 🚨 se Aplicações > Origens
3. **Evolução Patrimonial** (Δ ano-a-ano + aquisições significativas)
4. **Riscos por categoria fiscal** (cada um com base legal do agente correspondente):
   - Rendimento omitido (cód 010 — DIRF/R-4010)
   - Dedução indevida (cód 015 — recibo sem CPF, plano sem dependente, educação > R$ 3.561,50, PGBL > 12%)
   - Dependente (cód 070 — duplicado, > 24 anos, pais > R$ 23.456,38)
   - Ganho de capital (cód 050 — venda imóvel sem GCAP, isenções, redutores)
   - Renda variável (cód 060 — swing > R$ 20k/mês não declarado, day trade, cripto > R$ 35k/mês)
   - Aluguel/carnê-leão (PF não retido sem DARF 0190)
   - Bens no exterior (Lei 14.754/23)
5. **Recomendações ao Contador** (ações concretas: retificar X, solicitar doc Y ao cliente, abrir GCAP Z)
6. **Antes de transmitir — checklist final** (rodapé com itens críticos)

Regras transversais que entram em todos os prompts:

- Sempre citar a ficha/linha do PDF ao falar de um valor
- Sempre indicar a base legal (RIR/2018, Lei 9.250/95, IN 2.077/22, Lei 13.259/16, Lei 14.754/23) — não inventar
- Tabela 2026 fixa no prompt (faixas + dependente R$ 2.275,08 + simplificado R$ 16.754,34)
- Limites de dedução fixos (educação R$ 3.561,50/pessoa, PGBL 12%, médicas sem limite)
- Formato dos valores em BRL com R$ e separadores PT-BR
- Anti-padrões explícitos (lista do agente especialista)

### `riscos` (malha fina)

Reescrito com base no agente `malha-fina-pf-diagnostico`:
- Códigos de pendência mapeados (001/002/010/015/050/060/070/080/008)
- Para cada risco identificado: código provável + causa típica + decisão sugerida (retificar/defender) + base legal
- Cálculo do ajuste (IR adicional + multa + Selic) quando aplicável

### `analise` (geral / Simples × Completa)

Reescrito com base no agente `irpf-declaracao-completa`:
- Recomendação Simples × Completa com cálculo numérico explícito (não "achismo")
- Lista das 16 fichas obrigatórias com status (ok/faltando)
- Plano de pagamento (cota única em maio × 8 cotas mín R$ 50)

### `deducoes`

Mantém estrutura curta atual mas com limites legais corretos no prompt do sistema (educação por pessoa, PGBL 12%, médicas precisa CPF do paciente).

## Outros ajustes técnicos

1. **Tabela 2026 e limites movidos para uma constante `BASE_2026`** no topo do arquivo, reusada em todos os prompts (single source of truth — quando RFB publicar IN 2027, troca um lugar só).
2. **Adicionar nota no `base` prompt:** "Nunca invente valor de tabela ou base legal. Se não tem certeza, diga 'verificar IN RFB vigente' em vez de chutar."
3. **Não há mudança de schema, RLS, frontend ou config.toml** — a edge function é deployada automaticamente.

## Arquivos alterados

- `supabase/functions/ia-fiscal/index.ts` — função `getSystemPrompt()` reescrita + roteamento de modelo + constante `BASE_2026`.

Nada mais. Componente `SecaoAnaliseCaixa.tsx` continua igual (consome a mesma stream).

## Validação pós-deploy

Após aplicar, abrir uma declaração com PDF de análise de caixa anexado em `/declaracoes/:id` e:
- Conferir se a saída cita fichas/linhas do PDF
- Conferir se o saldo Origens × Aplicações fecha matematicamente
- Conferir se cita base legal (RIR, IN, Lei) em vez de afirmações genéricas

Quer que eu aplique?
