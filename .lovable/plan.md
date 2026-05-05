## Diagnóstico

Os cards (Saldo de Caixa, Variação Patrimonial, Nível de Risco, gráficos) sumiram porque o JSON salvo no banco da última análise está **corrompido / truncado**. Confirmei consultando `declaracao_analises` da declaração atual: o bloco ` ```json ... ``` ` tem trechos colados fora de lugar (ex.: `"atual": ":` e `"resumo":415.413,15"`), faltam fechamentos e a chave `riscos_count` está partida.

Causa raiz no backend (`supabase/functions/ia-fiscal/index.ts`, linhas 154–169): o stream SSE da Lovable AI chega em chunks que **não respeitam fronteira de linha**. O código faz `chunk.split("\n")` por chunk, sem buffer entre chunks. Quando uma linha `data: {...}` é dividida entre dois chunks, o `JSON.parse` falha silenciosamente (`catch` vazio) e o pedaço de `delta.content` daquela linha é **perdido para sempre**, embora ainda seja repassado ao cliente via `controller.enqueue(value)`.

Resultado: na primeira execução, o cliente até consegue mostrar parcialmente, mas o `fullResponse` salvo no banco vem furado. Em qualquer reload subsequente (que é o caso atual no histórico), o `VisualIAFiscal` recebe JSON inválido, cai no fallback de texto puro e os cards somem.

Adicionalmente, `VisualIAFiscal` só renderiza os 3 cards do topo se existir **`jsonData.resumo && jsonData.patrimonio`** simultaneamente — basta uma chave faltar para tudo desaparecer.

## O que vou alterar

### 1. `supabase/functions/ia-fiscal/index.ts` — buffer SSE correto
Manter um `buffer` acumulando entre chunks, processar somente até `\n`, devolver a sobra ao buffer. Garantir que `fullResponse` salvo no banco seja idêntico ao que o cliente recebeu. Sem mexer no `controller.enqueue(value)` (cliente continua recebendo o stream cru).

### 2. `src/components/declaracao/VisualIAFiscal.tsx` — render tolerante
- Mostrar os 3 cards do topo (Saldo, Patrimônio, Risco) sempre que **qualquer** dado estruturado existir (`resumo` OU `patrimonio` OU `riscos_count`), com placeholders "—" para o que faltar.
- Mostrar cada gráfico (Fluxo de Caixa / Fontes de Origem) só se os dados respectivos existirem, em vez de exigir o pacote completo.
- Continuar exibindo o texto completo abaixo via `AnaliseTecnicaVisual` mesmo quando o JSON está parcial.

### 3. `src/lib/parseAnalise.ts` — reparo mais agressivo
- Antes do `JSON.parse`, tentar fechar chaves/colchetes pendentes (contar `{`/`}` e `[`/`]`) e cortar o JSON no último ponto válido antes do dano. Isso permite recuperar `resumo`, `origens`, `aplicacoes` e `patrimonio` mesmo quando o final está corrompido.
- Expor `jsonData` recuperado parcial para o `VisualIAFiscal` consumir via `jsonOverride`.

### 4. `SecaoAnaliseCaixa.tsx` — pequeno ajuste
- Passar `jsonOverride` mesmo quando ele é parcial (já passa, mas garantir que não é descartado quando `resumo` existe sem `patrimonio`).
- Botão "Atualizar Análise (IA)" continua disponível para o usuário re-gerar a análise corrompida (após o fix do backend, virá íntegra).

## Resultado esperado
- Análises **novas** salvam JSON íntegro → cards e gráficos voltam a aparecer normalmente.
- Análises **antigas corrompidas** (como a de 05/05/2026 13:58 que está na tela): o parser tolerante recupera `resumo` (saldo R$ 151.304,99 já aparece na lista), mostra os cards de Saldo e Risco mesmo sem patrimônio completo, e o card de Variação Patrimonial mostra "—" em vez de sumir tudo.
- Usuário pode clicar "Atualizar Análise (IA)" para regerar com o backend corrigido.

## Sem mudanças
- Schema do banco intacto.
- Layout da tabela Histórico, tooltips e expansão (já funcionando).
- Modelo de IA (`gemini-2.5-pro`).
