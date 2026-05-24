## Diagnóstico

Verifiquei os logs: o upload do PDF foi processado com sucesso pelo parser nativo (`metodo=texto, confianca=0.65, winner=unpdf`), mas ele continuou extraindo o valor errado (R$ 18.406,97 em vez de R$ 892,31).

**Por que o hardening anterior não pegou:** quando o `unpdf` quebra a diagramação em duas colunas do "RESUMO", o valor 18.406,97 acaba ficando textualmente próximo do label "Imposto a Restituir", sem nenhum label concorrente entre eles — então a verificação de proximidade aprova, e o valor também não bate exatamente com os totais da blacklist. Resultado: o parser nativo declara sucesso e nem OCR nem IA são acionados.

A correção é inverter a estratégia para declarações: dar prioridade ao OCR (que preserva a posição visual e separa as colunas corretamente), com IA como segunda opção. O nativo continua atendendo recibos / MEI / DARF, onde funciona bem.

## Plano

### 1. Nova cascata para `tipo=declaracao` (subtipo DIRPF / Saída Definitiva)

Ordem passa a ser:

```
OCR.space  →  IA (Lovable AI)  →  Revisão manual
```

- O parser nativo regex continua rodando em paralelo apenas como **verificação silenciosa** (cross-check). Se OCR e nativo concordarem, ganha confiança extra; se divergirem, ignora o nativo.
- Se o PDF tiver mais de `OCR_MAX_BYTES` (1 MB free tier), pula OCR e vai direto para IA — sem cair em manual antes da hora.
- Anti-alucinação da IA (validação de que os números retornados existem literalmente no texto) continua ativa.

### 2. Demais tipos (`recibo`, `mei`, `darf`) — sem mudança

Mantém a cascata atual `Nativo → OCR (se scan) → IA → Manual`, porque nesses documentos o regex é confiável e barato.

### 3. Logs e telemetria

- Adicionar `[cascade] tipo=declaracao -> ocr|ia|manual` em cada decisão.
- Registrar quando OCR e nativo divergem (para futuro ajuste).
- Campo `metodo_validacao` na auditoria continua refletindo o método que ganhou (`ocr` / `ia` / `manual`).

### 4. Custo

- OCR.space: gratuito até 25k req/mês — sem impacto.
- IA: só dispara se OCR falhar OU o PDF estourar 1 MB — mantém o consumo de créditos baixo, conforme você pediu.

### 5. Arquivos alterados

- `supabase/functions/processar-pdf-declaracao/index.ts` — reordenação da cascata só para `tipo === "declaracao"`.
- `supabase/functions/processar-pdf-declaracao/extract-native.ts` — expor helper para rodar o parser nativo como cross-check sem retornar erro fatal.

Sem mudanças em schema, RLS, UI ou banco.

### 6. Validação

Depois do deploy, reenviar o `ANDRIA .pdf`. Esperado nos logs:

```
[cascade] tipo=declaracao -> ocr
[ocr] OK len=~12000 elapsedMs=...
[pipeline] OK metodo=ocr confianca=0.85
```

E o card deve passar a exibir **Restituição R$ 892,31**.
