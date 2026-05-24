## Objetivo

Reverter a edge function `processar-pdf-declaracao` para a versão antiga: extração feita exclusivamente pela Lovable AI sobre o texto do PDF, sem OCR.space, sem Vision (Gemini visual) e sem a cascata híbrida que foi adicionada depois.

## O que será feito

1. **`supabase/functions/processar-pdf-declaracao/index.ts`**
   - Remover imports e chamadas de `runOcrFallback`, `runVisionExtraction` e do parser nativo determinístico (`tryNativeValidation`, `parseFromText`).
   - Manter apenas: download do PDF, extração de texto bruto via `extractRawTextFromPdf`, chamada de `runAiExtraction` (Lovable AI) e a confirmação manual do contador como fallback.
   - Fluxo final para todos os tipos (declaração, recibo, mei, darf):
     1. Se veio `manual_confirmacao` → usa direto.
     2. Senão → extrai texto do PDF → chama IA → grava resultado.
     3. Se IA falhar ou texto for insuficiente → devolve `requires_manual_review` para abrir o modal de confirmação manual.
   - Remover toda a lógica de "vision/regex candidate/divergência" e logs relacionados.

2. **Excluir arquivos não usados**
   - `supabase/functions/processar-pdf-declaracao/ocr-fallback.ts`
   - `supabase/functions/processar-pdf-declaracao/vision-fallback.ts`
   - Manter `ai-fallback.ts` (é a IA) e `extract-native.ts` apenas se ainda for usado por `extractRawTextFromPdf`. Se sim, deixo só essa função e removo os parsers determinísticos não usados; se não, removo o arquivo todo.

3. **Não tocar em**
   - Frontend (modal de confirmação manual já existe e continua funcionando).
   - Schema/RLS/storage.
   - Outras edge functions.
   - Anexar/Email/Documentos extras (alterações anteriores ficam intactas).

## Resultado esperado

- Comportamento idêntico à versão "antes dos créditos acabarem": IA lê o texto do PDF e devolve os dados; se não der, abre o modal manual.
- Sem chamadas OCR/Vision, sem cascata complexa, sem rejeições por "evidência".

## Validação

- Deploy automático da função.
- Conferir nos logs (`supabase--edge_function_logs processar-pdf-declaracao`) que só aparece `[ia]` e nunca mais `[ocr]`, `[vision]` ou `[cascade]`.
