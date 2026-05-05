## Diagnóstico (com base na análise `a180a307…` salva no banco)

O texto salvo no banco tem **gaps reais de bytes** no meio do streaming SSE. Confirmado lendo o `resultado_texto`:

- Texto narrativo: `"R$ 7.437,68): R$ 364.8    *   **TOTAL APLICAÇÕES"` — o número `364.890,65` foi cortado.
- JSON estruturado:
  - `"patrimonio": { "anterior": 7437.68, "atual": ": 1, "baixo": 0 }` ← corrompido. Por isso o card mostra **R$ NaN, NaN%**.
  - `"riscos_count"` foi engolido pelo gap → cards mostram `0 Médio / 0 Baixo`.
  - `"resumo":415.413,15"` dentro de `secoes_analise` — outro gap.

Ou seja: o saldo (`151304.99`) sobreviveu porque está no início do JSON, mas tudo depois do gap virou lixo. O buffer SSE da edge function **não está perdendo linhas** — o problema é que pedaços de `delta.content` chegam vazios/quebrados do gateway em rajadas longas e ninguém faz **sanitização final** antes de gravar.

Também: o "Detalhamento Técnico Completo" da imagem 2 está renderizando como parede de texto porque o markdown da IA usa `*   ` mas o `prose-sm` aperta tudo, e não há separação visual entre subtemas.

## Correções

### 1. Edge `supabase/functions/ia-fiscal/index.ts` — sanitizar antes de salvar
- No `saveAnalysis`, **antes** de tentar `JSON.parse`, aplicar a mesma estratégia do `repairTruncatedJson` (balanceia chaves/colchetes, fecha string aberta, corta trailing comma) usada no front.
- Se o `JSON.parse` direto falhar, tentar variações progressivas (último `}` válido, remoção de strings malformadas via regex `"[^"]*$`).
- Salvar o JSON reparado em `resultado_json` mesmo quando parcial — assim o banco passa a ter dados confiáveis para o front.
- Adicionar `resumo_visual` mais completo: `{ saldo, estouro, riscos: { alto, medio, baixo }, patrimonio: { atual, anterior, variacao_perc }, veredito_msg }` para servir como fallback estável quando o JSON cru estiver corrompido.

### 2. `src/lib/parseAnalise.ts` — extrair o que sobrar e priorizar `resultado_json`/`resumo_visual`
- Adicionar bloco para **patrimônio**: pega de `jsonData.patrimonio` validando que `atual` e `anterior` são números finitos > 0; senão tenta `resumo_visual.patrimonio`; senão regex no `jsonRaw` (`extractNumber(..., 'atual')`, `'anterior'`, `'variacao_perc'`, `'variacao_valor'`).
- Retornar também `patrimonio: { atual, anterior, variacao_valor, variacao_perc } | null`.
- Forçar `Number.isFinite()` em todas as extrações para nunca propagar `NaN`.

### 3. `src/components/declaracao/VisualIAFiscal.tsx` — cards à prova de NaN + override completo
- Aceitar `jsonOverride` mais rico (incluindo `patrimonio` e `riscos_count` recompostos pelo parser).
- No card "Variação Patrimonial": só renderizar valor/percentual se `Number.isFinite(patrimonio.atual)` e `patrimonio.atual > 0` e `Number.isFinite(patrimonio.variacao_perc)`. Caso contrário mostrar "—" + tooltip "Dado indisponível na análise".
- Card "Nível de Risco": preferir `riscos_count` do override; nunca exibir 0/0/0 silencioso quando o parser conseguiu recuperar números — exibir contagens reparadas.
- Cards "Saldo" e "Variação" puxam do `jsonOverride` com prioridade total sobre o JSON inline truncado.

### 4. Legibilidade do "Detalhamento Técnico" (imagem 2)
Reescrever a tipografia do bloco final para parecer um relatório técnico:
- Trocar `prose-sm` por `prose-base` com `leading-7`.
- Aumentar espaçamentos: `prose-p:my-4`, `prose-ul:my-4`, `prose-li:my-2`, `prose-headings:mt-8 prose-headings:mb-3`, `prose-h2:text-lg prose-h3:text-base`.
- Adicionar plugin `remark-breaks` (já em árvore via `react-markdown`? não — adicionar `remark-breaks` ao bundle) para que quebras simples virem `<br/>`.
- Pré-processar o `textualFallback`: inserir linha em branco antes de cada `🚨`/`⚠️`/`✅`/`**Aquisição`/`**Patrimônio em` para criar parágrafos visuais.
- Renderizar dentro de um `Card` com `max-w-3xl mx-auto`, fundo `bg-card` e `divide-y` entre seções H2 — visual de "documento".
- Componente extra `<SectionDivider />` entre H2s para reforçar separação.

### 5. Banco
Nada a migrar. As análises antigas continuarão existindo; ao clicar "Atualizar Análise (IA)" o registro corrompido é substituído por um novo já saneado.

## Como fica para o usuário
- Após "Atualizar Análise (IA)": cards de Saldo, Variação Patrimonial e Nível de Risco aparecem completos e corretos.
- Análises antigas: ainda mostrarão "—" onde o JSON foi corrompido, mas sem quebrar o layout (sem mais NaN).
- O texto técnico passa a ter parágrafos espaçados, cabeçalhos destacados e listas legíveis, com aparência de relatório.

## Arquivos tocados
- `supabase/functions/ia-fiscal/index.ts` (saveAnalysis: reparo + resumo_visual completo)
- `src/lib/parseAnalise.ts` (extrai patrimônio + isFinite guards)
- `src/components/declaracao/VisualIAFiscal.tsx` (cards à prova de NaN + tipografia do bloco técnico)
- `package.json` (+ `remark-breaks`)
