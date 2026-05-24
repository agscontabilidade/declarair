## Mudança
Remover **toda notificação ao cliente** (e-mail + WhatsApp) disparada automaticamente quando o recibo é validado. Cliente só será notificado quando o contador clicar no aviãozinho (botão de envio manual).

## Arquivos

### 1. `supabase/functions/processar-pdf-declaracao/index.ts` (linhas ~457–525)
Remover do bloco `if (virouTransmitida)`:
- Bloco de **e-mail** ao cliente (linhas 475–500, `send-transactional-email` com template `declaracao-transmitida`)
- Bloco de **WhatsApp** ao cliente (linhas 502–524)

**Manter:**
- Notificação in-app (linhas 467–473) — fica só no painel do contador, não vai pro cliente.
- Busca do escritório (linhas 460–465) — ainda usada pela notificação in-app.
- Atualização de status para `transmitida` e demais updates.

### 2. `src/components/declaracoes/AnexarDeclaracaoButton.tsx` (linha 298)
Remover a frase `'Ao validar o recibo, a declaração será marcada como transmitida e o cliente notificado.'` (apagar a propriedade `descricao` do item Recibo, ou trocar para algo neutro como `'A declaração será marcada como transmitida.'`).

## Sem mudanças
- Schema, RLS, billing, lógica de extração/IA, status, template `declaracao-transmitida` (fica disponível para envio manual via aviãozinho).
- Fluxo do botão aviãozinho permanece exatamente igual.

## Validação
1. Anexar recibo válido → status vira `transmitida`, notificação in-app criada, **nenhum e-mail e nenhum WhatsApp** disparado ao cliente.
2. Clicar no aviãozinho de envio → e-mail dispara normalmente (fluxo independente).