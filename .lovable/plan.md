
## Objetivo

Quando o pipeline determinístico atual detectar que o PDF é uma imagem escaneada (`scan_sem_texto_real`), em vez de cair direto no modal manual, enviar o PDF para a API do OCR.space, recuperar o texto reconhecido e re-executar os mesmos parsers regex já existentes. Modal manual vira último recurso real (só se OCR também falhar).

## Pré-requisito do usuário

1. Criar conta gratuita em https://ocr.space/ocrapi
2. Copiar a API key (free tier: 25.000 requisições/mês, arquivos até 1MB no plano free; plano PRO ~US$ 30/mês permite até 5MB)
3. Eu vou pedir a key via `add_secret` com o nome `OCRSPACE_API_KEY`

## Mudanças no código

Tudo isolado em `supabase/functions/processar-pdf-declaracao/`. Nenhuma mudança em UI, banco, RLS ou schema.

### 1. Novo arquivo: `ocr-fallback.ts`
- Função `runOcrFallback(bytes: Uint8Array): Promise<string>`
- Faz POST multipart para `https://api.ocr.space/parse/image` com:
  - `apikey`: do env
  - `language`: `por`
  - `isCreateSearchablePdf`: false
  - `OCREngine`: 2 (melhor para formulários)
  - `scale`: true
  - `file`: o PDF
- Concatena `ParsedText` de todas as páginas
- Timeout de 45s, retorna string vazia em erro (não joga exceção)
- Loga tamanho do texto retornado e tempo gasto

### 2. `extract-native.ts` — exportar parsers isoladamente
- Refatorar para expor `parseFromText(text, tipo, anoBase, cpfCliente)` que recebe texto já pronto e roda só a fase de regex/scorer/DV (sem extração PDF).
- A função atual `tryNativeValidation` continua igual; passa a chamar internamente `parseFromText` depois de obter o texto via cascata.
- **Escopo:** refatoração mínima de extração interna; lógica de parsing não muda.

### 3. `index.ts` — encadear OCR
No bloco onde hoje retorna `manualReview` por falha do pipeline:

```text
se native.ok → segue normal
senão se native.reason ∈ {scan_sem_texto_real, scan_sem_texto, texto_pdf_inacessivel}:
    texto_ocr = await runOcrFallback(bytes)
    se texto_ocr.length > 100:
        ocrResult = parseFromText(texto_ocr, tipo, anoBase, cpfCliente)
        se ocrResult.ok:
            extracao = ocrResult.data
            metodoValidacao = "ocr"
            pipelineOk = true
            log: validado via OCR.space
        senão:
            manualReview com motivo específico OCR
    senão:
        manualReview "OCR não retornou texto suficiente"
senão:
    manualReview (caminho atual)
```

### 4. Auditoria e logs
- Adicionar `metodoValidacao = "ocr"` ao tipo (hoje só aceita `regex | manual`)
- Mensagem de atividade: "validada automaticamente via OCR" para distinguir de regex puro
- Log `[ocr] tipo=X tamanho_texto=N tempo_ms=Y`

## Pontos técnicos importantes

- **Limite de tamanho:** Free tier OCR.space aceita até 1MB. A função já valida 18MB; vou adicionar pré-validação: se `bytes.length > 1_000_000` e API for free, retornar modal manual com mensagem "PDF muito grande para OCR gratuito (>1MB) — confirme manualmente ou peça o PDF original do PGD." Caso o usuário tenha plano PRO, basta ajustar a constante.
- **Sem custo de CPU adicional na edge function:** OCR roda no servidor do OCR.space, não consome o worker Supabase (resolve o `WORKER_RESOURCE_LIMIT`).
- **Não muda o caminho feliz:** PDFs nativos do PGD continuam sendo processados em milissegundos pelo pipeline determinístico. OCR só dispara em scan real.
- **Segurança:** API key fica em secret, nunca exposta ao frontend.

## Arquivos afetados

- `supabase/functions/processar-pdf-declaracao/ocr-fallback.ts` (novo)
- `supabase/functions/processar-pdf-declaracao/extract-native.ts` (refatoração mínima para expor `parseFromText`)
- `supabase/functions/processar-pdf-declaracao/index.ts` (encadeamento OCR + tipo `metodoValidacao`)

## Validação após deploy

1. Re-enviar o PDF escaneado que está dando problema → deve validar automaticamente via OCR
2. Re-enviar um PDF nativo do PGD → continua via `regex` (rápido, sem chamar OCR)
3. Conferir logs: `[ocr]` aparece só nos casos esperados
4. Conferir contador de uso em ocr.space/dashboard

## O que NÃO está no escopo

- Nenhuma mudança em UI/modal
- Nenhum schema/migration
- Não toco no `ConfirmarDocumentoManualDialog` (continua existindo como último recurso)
- Não mudo limite de tamanho do arquivo (segue 18MB)
