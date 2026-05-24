# Voltar à leitura nativa do PDF pelo Gemini (multimodal)

## Problema
Hoje a edge function extrai texto do PDF localmente com `unpdf` e manda só o texto pra IA. Isso falha em:
- PDFs escaneados (imagem)
- PDFs com fontes/codificação que o `unpdf` não decifra
- PDFs/A com texto vetorizado

Resultado: o sistema dispara "manual review" mesmo quando o Gemini conseguiria ler.

## Solução
Voltar ao modelo anterior: enviar o **PDF inteiro em base64** direto pro Lovable AI Gateway (Gemini). Gemini lê PDF nativo, faz OCR de imagens e entende layout — funciona para PDF texto, PDF/A e PDF escaneado.

## Mudanças

### 1. `supabase/functions/processar-pdf-declaracao/ai-fallback.ts`
- Trocar a assinatura `runAiExtraction(fullText, tipo, ano, cpf)` por `runAiExtraction(pdfBytes: Uint8Array, tipo, ano, cpf)`.
- Converter `pdfBytes` em base64 e enviar no payload do Gemini usando o formato OpenAI-compatível do Lovable AI Gateway com **content multimodal**:
  ```ts
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: [
        { type: "text", text: userPromptInstrucoes },
        { type: "image_url", image_url: { url: `data:application/pdf;base64,${b64}` } }
    ]}
  ]
  ```
- Remover `truncateForAi`, `MAX_TEXT_CHARS` e toda a lógica de janela do RESUMO (Gemini lê o PDF inteiro).
- Remover `valueExistsInSource` e a checagem "valor existe literalmente no texto" — não temos mais o texto cru pra comparar.
- Manter validações cruzadas que **não** dependem do texto: CPF formato + match com cliente, CNPJ formato (MEI), ano vs ano_base, formato `XX.XX.XX.XX.XX-XX` do número do recibo, código de receita do DARF.
- Prompts atualizados para deixar claro que o modelo está **lendo um PDF** (não texto), e instruir a procurar visualmente "Imposto a Restituir / Imposto a Pagar" no recibo.
- Trocar modelo padrão se necessário: `google/gemini-3-flash-preview` já suporta PDF multimodal — mantém.
- Aumentar limite de tamanho aceito: hoje rejeita >18MB no `index.ts`. Manter esse limite (PDFs de declaração + recibo raramente passam disso).

### 2. `supabase/functions/processar-pdf-declaracao/index.ts`
- Remover a chamada a `extractRawTextFromPdf(bytes)` e a checagem "textLength < 80".
- Passar `bytes` direto para `runAiExtraction(bytes, tipo, anoBaseNum, cliente.cpf)`.
- Remover import de `extract-text.ts`.

### 3. Cleanup
- Apagar `supabase/functions/processar-pdf-declaracao/extract-text.ts` (não usado em mais nada).
- Remover dependência `unpdf` da função (se estava listada em `deno.json` ou import map).

### 4. Sem mudanças
- Schema do banco, frontend, modais, RLS, billing, lógica de status, lógica recibo×declaração da última mudança (resultado vem do recibo).

## Validação
1. Upload de **recibo PDF normal (texto)** → Gemini extrai numero/data/tipo_resultado/valor → status `transmitida`.
2. Upload de **recibo PDF escaneado (imagem)** → Gemini faz OCR e extrai os mesmos campos.
3. Upload de **declaração PDF/A** → Gemini valida CPF/ano, arquivo é registrado sem mexer no resultado.
4. Confirmar nos logs `[ia]` que não há mais "texto extraído chars=" nem fallback a manual review por texto insuficiente.

## Riscos
- **Custo/latência**: enviar PDF inteiro consome mais tokens que o texto truncado. Aceitável dado o requisito do usuário (precisa funcionar com PDFs imagem).
- **Tamanho máx**: PDFs muito grandes (>10MB) podem demorar ou estourar timeout do gateway. Limite atual de 18MB no upload é mantido; se aparecer timeout, considerar reduzir.
- **Gateway**: se o Lovable AI Gateway ainda não suportar `image_url` com `data:application/pdf;base64,...`, será preciso usar o formato Gemini nativo `inline_data`. Se a primeira tentativa falhar com erro de "tipo de mídia não suportado", troco pra esse formato.
