
## Objetivo
Na coluna "Anexar declaração" da `/declaracoes`, permitir upload de **dois PDFs** (Declaração e Recibo). O sistema lê os PDFs com IA (Lovable AI Gateway), valida que são realmente IRPF/Recibo da Receita, extrai metadados e, ao receber o **Recibo**, marca a declaração como **Transmitida** e notifica o cliente (in-app + email + WhatsApp se ativo).

## 1. Banco de dados (migração)
Adicionar à tabela `declaracoes`:
- `arquivo_recibo_url text`
- `arquivo_recibo_nome text`
- `arquivo_recibo_uploaded_at timestamptz`
- `recibo_validado_em timestamptz` — quando IA confirmou
- `recibo_numero text` — número de recibo extraído do PDF
- `declaracao_validada_em timestamptz`
- `declaracao_extracao jsonb` — metadados extraídos (cpf, nome, ano, valor, tipo)
- `recibo_extracao jsonb`

Sem mudanças em RLS (já cobertas).

## 2. Edge Function: `processar-pdf-declaracao`
Nova função (`verify_jwt = false`, valida JWT em código) responsável pelo fluxo crítico:

**Input:** `{ declaracao_id, tipo: 'declaracao' | 'recibo', storage_path }`

**Passos:**
1. Validar JWT, obter usuário e `escritorio_id`.
2. Confirmar que a declaração pertence ao escritório.
3. Baixar PDF do bucket `documentos-clientes` (service role).
4. Converter PDF em base64 e enviar para **Lovable AI** (`google/gemini-2.5-flash`) com prompt estruturado pedindo JSON:
   - Para `declaracao`: `{ eh_declaracao_irpf: bool, cpf, nome, ano_exercicio, tipo_resultado, valor_resultado, motivo_rejeicao? }`
   - Para `recibo`: `{ eh_recibo_rfb: bool, numero_recibo, cpf, ano_exercicio, data_transmissao, motivo_rejeicao? }`
5. Validar coerência: CPF do PDF == CPF do cliente; ano == `ano_base`. Se divergir → rejeita com mensagem clara.
6. Atualizar `declaracoes`:
   - **Declaração validada:** preenche `arquivo_declaracao_*`, `declaracao_validada_em`, `declaracao_extracao`, `tipo_resultado`, `valor_resultado` (se ainda vazios), e `status = 'declaracao_pronta'` (se estava em estágio anterior).
   - **Recibo validado:** preenche `arquivo_recibo_*`, `recibo_numero`, `recibo_validado_em`, `recibo_extracao`, `numero_recibo`, `data_transmissao`, e força `status = 'transmitida'`, `status_processamento_rfb = 'aguardando'`.
7. Se virou **transmitida**:
   - Insere `notificacoes` para o escritório.
   - Insere `declaracao_atividades` (auditoria).
   - Chama `send-transactional-email` com template `declaracao-transmitida` para o cliente.
   - Se escritório tem WhatsApp ativo (`integracoes_whatsapp` ativo), invoca `whatsapp-service` com mensagem padronizada.
8. Retorna `{ ok: true, status_novo, extracao }` ou `{ ok: false, motivo }`.

**Tratamento robusto:** wrap em try/catch, logs detalhados, status HTTP 200 mesmo em rejeição (com `ok:false`) para o frontend tratar; 4xx/5xx só em erros sistêmicos. Idempotente — reprocessar mesmo PDF não duplica notificações (checa `recibo_validado_em`).

## 3. Frontend — `AnexarDeclaracaoButton.tsx`
Reescrever para suportar **dois slots** (Declaração + Recibo) num único `Popover`/menu:

```text
[Anexar ▾]
 ├─ 📄 Declaração     [Anexar | Baixar | ✓]
 └─ 🧾 Recibo         [Anexar | Baixar | ✓]
```

Comportamento:
- Cada slot tem seu próprio `<input type="file" accept="application/pdf">`.
- Ao selecionar: faz upload no Storage (path `{escritorio_id}/declaracoes/{id}/{tipo}-{timestamp}.pdf`), depois invoca `processar-pdf-declaracao`.
- Mostra `Loader2` "Validando com IA..." enquanto processa.
- Em rejeição: `toast.error(motivo)` e remove o arquivo do Storage.
- Em sucesso: badge verde com nome + tooltip; ícone download abre signed URL (5min).
- Quando recibo validado → badge "Transmitida ✓" sutil ao lado.

Props atualizadas para receber `arquivoReciboUrl`, `arquivoReciboNome`, `reciboValidadoEm`.

## 4. Atualização em `Declaracoes.tsx`
- Incluir nos selects: `arquivo_recibo_url, arquivo_recibo_nome, recibo_validado_em`.
- Passar para `AnexarDeclaracaoButton`.
- Como já há realtime + trigger `touch_declaracao_ultima_atualizacao`, o status muda visualmente sozinho.

## 5. Notificação ao cliente (template já existe)
Reusar `declaracao-transmitida.tsx` enviando:
```ts
{
  template: 'declaracao-transmitida',
  to: cliente.email,
  data: { nome_cliente, ano_base, numero_recibo, escritorio_nome }
}
```

WhatsApp (se ativo):
> "Olá {nome}! Sua declaração de IRPF {ano} foi transmitida com sucesso. Recibo: {numero}. Em breve enviaremos uma cópia. — {escritorio}"

## 6. Configuração
- `supabase/config.toml`: adicionar bloco para `processar-pdf-declaracao` com `verify_jwt = false` (validação manual no código, padrão dos demais).
- Sem novos secrets — `LOVABLE_API_KEY` já existe.

## Detalhes técnicos
- **Modelo IA:** `google/gemini-2.5-flash` (rápido, multimodal, lê PDF nativo via base64 inline).
- **Tamanho máx:** 20MB por arquivo (já validado no front).
- **Garantia de transmissão:** o status só muda para `transmitida` **após** IA validar o **recibo**. Anexar só a declaração não transmite.
- **Anti-duplicação:** edge function checa `recibo_validado_em IS NULL` antes de notificar.
- **Logs:** auditoria via `declaracao_atividades` em cada etapa.

## Arquivos a criar/editar
- `supabase/migrations/<timestamp>_recibo_declaracao.sql` (novos campos)
- `supabase/functions/processar-pdf-declaracao/index.ts` (novo)
- `supabase/config.toml` (bloco da função)
- `src/components/declaracoes/AnexarDeclaracaoButton.tsx` (reescrito com 2 slots)
- `src/pages/Declaracoes.tsx` (selects + props extras)
