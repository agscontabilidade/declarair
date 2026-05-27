
# Fix: lembrete preso na fila + lentidão percebida

## Diagnóstico
- **Backend**: saudável (`cloud_status` OK).
- **Fila `transactional_emails`**: 1 mensagem travada (msg_id 60, 19 retries), falhando com `missing_parameter: to`.
- **Causa do email não enviado**: a edge function `enviar-lembretes-prazo` enfileira payload no formato errado (`{ template_name, recipient_email, template_data }`). O dispatcher `process-email-queue` espera o email **já renderizado** (`{ to, from, subject, html, text, sender_domain, ... }`), como faz o `send-transactional-email`.
- **Lentidão**: 1 retry a cada 5s não trava o sistema; a percepção de lentidão é do preview/cliente, não do banco. Mas vou limpar o lixo da fila pra parar os retries.

## Correção

### 1. Limpar msg_id 60 da fila (migration)
```sql
SELECT pgmq.delete('transactional_emails', 60);
```

### 2. Corrigir `supabase/functions/enviar-lembretes-prazo/index.ts`
Trocar o bloco do canal `email` para **invocar `send-transactional-email`** (que renderiza React Email, checa suppression, gera unsubscribe token e enfileira no formato correto) em vez de chamar `enqueue_email` direto:

```ts
const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    apikey: anonKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    templateName: "lembrete-prazo-ir",
    recipientEmail: cli.email,
    idempotencyKey: `lembrete-${declaracaoId || cli.id}-${body.prazoFinal}`,
    templateData: { nomeCliente, nomeEscritorio, prazoFinal: prazoBR, anoBase, linkPortal, mensagemPersonalizada },
  }),
});
```

- Mantém rate-limit/queue safety (envio continua assíncrono via dispatcher).
- Mesma técnica usada em todos os outros disparos transacionais (cobrança, declaração transmitida, etc.).
- WhatsApp **não muda**.

### 3. Redeploy
`enviar-lembretes-prazo` precisa de redeploy após o fix.

## Arquivos
- `supabase/functions/enviar-lembretes-prazo/index.ts` — só o bloco do canal `email`.
- Migration única: `SELECT pgmq.delete('transactional_emails', 60);`

## Fora de escopo
- Não toca em `process-email-queue`, `send-transactional-email`, templates, UI, hook, RLS, GRANTs ou config.toml.
- Não mexe em `lembretes_enviados` (a row antiga com status `enfileirado` fica como histórico).

## Após o fix
Reabrir `/lembretes`, selecionar o Gelson e disparar de novo — o email deve chegar em até ~5s.
