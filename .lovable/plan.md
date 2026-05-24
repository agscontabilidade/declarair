
## Diagnóstico

Hoje a extração do `tipo_resultado` / `valor_resultado` da declaração depende de:

1. OCR.space → texto cru (perde colunas, junta números, limita 3 páginas no free)
2. Regex sobre o texto → frágil em PDFs em 2 colunas (pega "Total de Rendimentos" no lugar de "Imposto a Restituir")
3. IA **somente texto** (Gemini Flash) → recebe o mesmo texto bagunçado do OCR

Resultado: para PDFs como o da Andrea, o valor "R$ 1.836,56" não bate com o que está na declaração porque o modelo nunca vê o layout real — vê uma sopa de números.

A causa raiz é ler texto em vez de **ver** o documento. Receita Federal usa layout fixo (RESUMO em tabela). Modelos multimodais (Gemini 2.5 Pro / GPT-5) leem esse bloco com precisão de humano.

## Solução definitiva

Trocar o fallback de IA por **leitura visual do PDF** com validação dupla. O texto OCR deixa de ser fonte de verdade e passa a ser apenas guarda anti-alucinação.

### Novo pipeline (apenas para `tipo = "declaracao"`)

```
1. Native regex (rápido, só aceita se confiança alta + valor bate com label)
        ↓ falhou
2. VISION AI (NOVO):
        a. Renderiza páginas 1–4 do PDF em PNG (pdf.js / Deno)
        b. Envia imagens + prompt para google/gemini-2.5-pro com tool calling
        c. Modelo retorna: tipo_resultado, valor_resultado, label_lido,
           pagina_origem, linha_citada (texto exato copiado do PDF)
        ↓ validações cruzadas obrigatórias
3. Anti-alucinação dupla:
        - linha_citada precisa existir (fuzzy) no texto OCR
        - valor_resultado precisa aparecer no OCR
        - valor não pode coincidir com total de rendimentos / base de cálculo / imposto devido
        - se restituição: linha_citada precisa conter "RESTITUIR"
        - se pagamento:   linha_citada precisa conter "PAGAR"
        ↓ tudo ok
4. Grava no banco
        ↓ qualquer falha
5. Modal de confirmação manual (já existe)
```

Recibo / MEI / DARF continuam no pipeline atual (rápido, barato, já funciona bem).

### Por que isso resolve em definitivo

- O modelo **vê** a célula "Imposto a Restituir" do bloco RESUMO, não adivinha pelo texto solto
- Gemini 2.5 Pro tem visão nativa de alta precisão para tabelas PT-BR
- A `linha_citada` força o modelo a copiar literalmente o que viu — se inventar, a validação contra o OCR rejeita
- Se a validação falhar, **nada é salvo**: vai para revisão manual em vez de gravar valor errado

## Mudanças técnicas

### Arquivos a editar
- `supabase/functions/processar-pdf-declaracao/ai-fallback.ts` — adicionar `runVisionExtraction(pdfBytes, ocrText, anoBase, cpf)` usando `google/gemini-2.5-pro` com mensagens multimodais (`image_url` data-URI). Manter `runAiExtraction` apenas como último recurso para recibo/MEI/DARF.
- `supabase/functions/processar-pdf-declaracao/index.ts` — quando `tipo === "declaracao"` e nativo falhar, chamar `runVisionExtraction` antes do fallback de texto. Cascata final: native → vision → manual.
- Adicionar utilitário `pdfToImages(bytes, maxPages=4)` em `extract-native.ts` usando `pdfjs-dist` (já em uso) + canvas do Deno (ou `npm:pdf-to-png-converter` se mais simples no edge runtime).

### Sem mudanças
- Schema do banco, RLS, UI, fluxos de Recibo/MEI/DARF, fluxo manual, modal de upload, e-mails.

### Custo
- Gemini 2.5 Pro com 2–4 imagens por declaração é mais caro que Flash, mas só roda quando o native falha (caso real, não rotina). Trade-off: precisão > custo, pois um erro de extração quebra a confiança do contador.

### Risco e mitigação
- Renderização de PDF no Deno pode falhar em PDFs corrompidos → mantém fallback para modal manual.
- Limite de tokens/imagens do gateway → cap em 4 páginas (suficiente: RESUMO sempre na pág. 1–2).
- Se a Lovable AI estourar créditos (402) → modal manual, sem dado errado salvo.

## Critério de sucesso

Reenviar a declaração da Andrea + as últimas 5 declarações que falharam. O valor extraído precisa bater 100% com o RESUMO impresso. Qualquer divergência → revisão manual (nunca gravar errado).
