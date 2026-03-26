# DeclaraIR — Procedimento de Deploy para Produção

> Versão: 1.0 | Última atualização: 2026-03-26

---

## PRÉ-DEPLOY

| # | Ação | Responsável | Status |
|---|------|-------------|--------|
| 1 | Validar checklist completo de produção (segurança, RLS, edge functions, testes) | Tech Lead | ☐ |
| 2 | Backup completo do banco de dados via Lovable Cloud | Tech Lead | ☐ |
| 3 | Criar snapshot/versão no Lovable (histórico de versões) | Dev | ☐ |
| 4 | Conectar GitHub e fazer push da versão estável | Dev | ☐ |
| 5 | Notificar time sobre janela de manutenção (mín. 2h antes) | PM | ☐ |
| 6 | Confirmar que todos os testes passam (`npm run test`) | Dev | ☐ |

---

## DEPLOY — ORDEM DE EXECUÇÃO

### Fase 1: Banco de Dados (zero downtime)

**Objetivo:** Aplicar alterações de schema sem interromper o serviço.

1. **Aplicar migrations** na seguinte ordem (via Lovable Cloud → Run SQL):
   - Criar novas tabelas (se houver)
   - Adicionar colunas opcionais (`ALTER TABLE ... ADD COLUMN ... DEFAULT ...`)
   - Criar/atualizar índices
   - Atualizar/criar policies RLS
   - Criar/atualizar funções SQL (`SECURITY DEFINER`)
   - Criar/atualizar triggers

2. **Validar migrations:**

```sql
-- Verificar policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar extensões
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pgmq');

-- Verificar funções críticas
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
  'get_user_escritorio_id',
  'get_user_cliente_id',
  'has_role',
  'handle_new_accountant_signup',
  'atualizar_cobrancas_vencidas',
  'notificar_cobrancas_vencendo'
);

-- Verificar tabelas com RLS ativo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Critério de sucesso:** Todas as tabelas com `rowsecurity = true`, todas as funções listadas existem.

---

### Fase 2: Edge Functions

**Objetivo:** Atualizar funções serverless. O deploy é automático no Lovable.

1. **Ordem de deploy** (por dependência):
   - `_shared/asaas-config.ts` (helper compartilhado)
   - `billing-webhook/index.ts` (recebe webhooks Asaas)
   - `billing-service/index.ts` (cria cobranças Asaas)
   - `inter-cobranca/index.ts` (integração Banco Inter)
   - `whatsapp-service/index.ts` (envio WhatsApp)
   - `process-email-queue/index.ts` (fila de emails)

2. **Testar cada function após deploy:**

```bash
# Teste de saúde — billing-webhook (deve retornar 405 ou erro de token)
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://bykqurgeptipguqvxwiq.supabase.co/functions/v1/billing-webhook

# Teste com token inválido (deve retornar 401/403)
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://bykqurgeptipguqvxwiq.supabase.co/functions/v1/billing-webhook \
  -H "Authorization: Bearer token_invalido" \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'
```

**Critério de sucesso:** Functions respondem com códigos HTTP esperados, sem erros 500.

---

### Fase 3: Secrets de Produção

**Objetivo:** Configurar credenciais de produção nas edge functions.

1. **Secrets a configurar** (via Lovable Cloud → Secrets):

| Secret | Valor | Observação |
|--------|-------|------------|
| `ASAAS_API_KEY` | Chave de **produção** do Asaas | Substituir a chave sandbox |
| `ASAAS_WEBHOOK_TOKEN` | Token gerado (`openssl rand -hex 32`) | Mesmo token no Asaas |
| `EVOLUTION_API_URL` | URL da instância Evolution API | Para WhatsApp |
| `EVOLUTION_API_KEY` | Chave da Evolution API | Para WhatsApp |

2. **Validar que secrets estão configurados:**
   - Verificar na interface Lovable Cloud → Secrets
   - Testar chamada real a uma edge function que use o secret

> ⚠️ **IMPORTANTE:** O helper `asaas-config.ts` detecta automaticamente o ambiente pela variável `ASAAS_ENVIRONMENT`. Se não definida, usa sandbox por padrão.

---

### Fase 4: Frontend

**Objetivo:** Publicar a versão mais recente do frontend.

1. Verificar que o build passa sem erros no preview do Lovable
2. Clicar em **Publish → Update** no Lovable
3. Aguardar propagação (2-5 minutos)
4. Verificar a URL publicada: `https://declarair.lovable.app`

**Critério de sucesso:** App carrega sem erros, login funciona, dashboard renderiza.

---

### Fase 5: Validação Pós-Deploy (Smoke Tests)

Executar na URL de produção, **na ordem abaixo**:

| # | Teste | Como validar | ✓ |
|---|-------|-------------|---|
| 1 | Landing page carrega | Acessar `/` — sem erros no console | ☐ |
| 2 | Login funciona | Entrar com conta de teste | ☐ |
| 3 | Dashboard renderiza | KPIs e Kanban carregam | ☐ |
| 4 | Criar cliente | Formulário salva sem erro | ☐ |
| 5 | Criar declaração | Declaração aparece no Kanban | ☐ |
| 6 | Criar cobrança | Cobrança aparece na lista | ☐ |
| 7 | Marcar cobrança como paga | Status atualiza para "pago" | ☐ |
| 8 | Enviar convite ao cliente | Email/WhatsApp dispara | ☐ |
| 9 | Login do cliente (portal) | Cliente acessa `/cliente/dashboard` | ☐ |
| 10 | Upload de documento | Arquivo salva no storage | ☐ |
| 11 | Logout | Sessão encerra, redireciona para login | ☐ |

**Monitorar por 30 minutos após o deploy:**
- Console do browser (erros JS)
- Edge Function Logs (via Lovable Cloud)
- Tabela `system_logs` (erros de cron/automação)

---

### Fase 6: Configuração Externa

1. **Asaas — Configurar webhook de produção:**
   - URL: `https://bykqurgeptipguqvxwiq.supabase.co/functions/v1/billing-webhook`
   - Header: `Authorization: Bearer [ASAAS_WEBHOOK_TOKEN]`
   - Eventos: `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_CREATED`

2. **Teste end-to-end de cobrança:**
   - Criar cobrança real de **R$ 5,00** (mínimo permitido)
   - Pagar via Pix
   - Verificar que webhook atualizou o status para "pago"
   - Verificar notificação criada

3. **Evolution API (WhatsApp):**
   - Confirmar instância conectada
   - Enviar mensagem de teste

---

## ROLLBACK PLAN

### Rollback Rápido (< 5 min)

Usar quando: Erro no frontend ou bug visual detectado.

1. No Lovable, acessar histórico de versões
2. Restaurar para a versão anterior ao deploy
3. Clicar **Publish → Update**
4. Aguardar propagação (2-5 min)
5. Validar que a versão anterior está ativa

### Rollback Completo (10-15 min)

Usar quando: Erro em migrations ou edge functions.

| Passo | Ação | Tempo |
|-------|------|-------|
| 1 | Reverter frontend (Lovable → versão anterior) | 2 min |
| 2 | Reverter migrations SQL (script de rollback) | 5 min |
| 3 | Restaurar secrets anteriores (se alterados) | 2 min |
| 4 | Atualizar webhook Asaas para URL de sandbox | 2 min |
| 5 | Validar smoke tests | 5 min |

### Validação Pós-Rollback

1. Executar smoke tests (Fase 5)
2. Verificar integridade dos dados:

```sql
-- Contar registros em tabelas críticas
SELECT 'escritorios' AS tabela, count(*) FROM escritorios
UNION ALL SELECT 'clientes', count(*) FROM clientes
UNION ALL SELECT 'declaracoes', count(*) FROM declaracoes
UNION ALL SELECT 'cobrancas', count(*) FROM cobrancas;
```

3. Monitorar logs por 15 minutos
4. Comunicar time sobre o rollback

---

## COMUNICAÇÃO

### Template: Início do Deploy

```
🚀 Deploy em progresso — DeclaraIR v[X.Y.Z]
Fase: [1/6] Banco de Dados
Início: [HH:MM]
Previsão de conclusão: [HH:MM]
Responsável: [Nome]
```

### Template: Deploy Concluído

```
✅ Deploy concluído com sucesso — DeclaraIR v[X.Y.Z]
Duração: [XX] minutos
Smoke tests: Todos passaram
Próxima ação: Monitorar por 30 min
```

### Template: Rollback

```
⚠️ Rollback executado — DeclaraIR
Motivo: [Descrição breve]
Versão restaurada: [anterior]
Status: Sistema estável
Próxima ação: Post-mortem em [data]
```

### Template: Post-Mortem

```
📋 Post-Mortem — Deploy [data]
O que aconteceu: [descrição]
Impacto: [duração/usuários afetados]
Causa raiz: [análise]
Ações corretivas: [lista]
Prevenção futura: [medidas]
```

---

## CHECKLIST FINAL

- [ ] Todas as 6 fases concluídas
- [ ] Smoke tests passaram
- [ ] Monitoramento de 30 min sem incidentes
- [ ] Comunicação enviada ao time
- [ ] Documento atualizado com data do deploy
