## Plan: Update processing confirmation wording

Replace "processada com sucesso" with "processada com sucesso e sem pendências" in the processing confirmation modal and email template.

### Files to edit
1. `src/components/declaracoes/ComprovacaoProcessamentoModal.tsx`
   - Line 76: default message textarea text

2. `supabase/functions/_shared/transactional-email-templates/processamento-receita-confirmado.tsx`
   - Line 40: `<Heading>` preview text
   - Line 56: default email body fallback
   - Line 112: `previewData.mensagemPersonalizada`

### Post-edit
- Redeploy `send-transactional-email` and `preview-transactional-email` edge functions.