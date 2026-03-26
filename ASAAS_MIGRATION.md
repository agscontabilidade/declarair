# Migração Asaas: Sandbox → Produção

## 📋 Pré-requisitos

Antes de migrar para produção no Asaas, você precisa:

### 1. Documentação da Empresa
- [ ] CNPJ ativo na Receita Federal
- [ ] Contrato Social ou Requerimento de Empresário (MEI)
- [ ] Comprovante de endereço da empresa (máx. 3 meses)
- [ ] Cartão CNPJ atualizado

### 2. Documentação do Responsável Legal
- [ ] CPF do representante legal
- [ ] RG ou CNH (frente e verso)
- [ ] Comprovante de residência (máx. 3 meses)
- [ ] Selfie segurando documento

### 3. Dados Bancários
- [ ] Banco, agência e conta para recebimento
- [ ] Tipo de conta (corrente ou poupança)
- [ ] CPF/CNPJ do titular da conta

## 🚦 Status Atual

**Ambiente:** Sandbox
**URL API:** `https://sandbox.asaas.com/api/v3`
**Chave API (sandbox):** Configurada no secret `ASAAS_API_KEY`
**Webhook:** `https://bykqurgeptipguqvxwiq.supabase.co/functions/v1/billing-webhook`

## 📝 Processo de Aprovação

### Passo 1: Solicitar Aprovação no Painel Asaas

1. Acesse: https://www.asaas.com
2. Faça login na sua conta sandbox
3. Vá em **Configurações → Migração para Produção**
4. Preencha todos os dados solicitados
5. Faça upload de todos os documentos
6. Envie para análise

**Prazo esperado:** 2-5 dias úteis

### Passo 2: Aguardar Análise

Você receberá emails do Asaas em cada etapa:
- ✉️ Documentos recebidos
- ✉️ Em análise
- ✉️ Pendências (se houver)
- ✉️ Aprovado para produção

### Passo 3: Ativar Produção

Quando aprovado:
1. O Asaas enviará a **chave de API de produção**
2. Salve essa chave em local seguro (não commitar no Git!)
3. A URL de produção é: `https://api.asaas.com/v3`

## 🔧 Mudanças no Código

**Boa notícia:** O código JÁ está preparado para produção! 🎉

O arquivo `_shared/asaas-config.ts` detecta automaticamente o ambiente:
```typescript
export const getAsaasConfig = () => {
  const isProd = Deno.env.get('ASAAS_ENVIRONMENT') === 'production';

  return {
    apiKey: Deno.env.get(isProd ? 'ASAAS_API_KEY' : 'ASAAS_SANDBOX_API_KEY'),
    baseUrl: isProd ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3',
    environment: isProd ? 'production' : 'sandbox'
  };
};
```

**Nenhuma mudança de código necessária!**

## ⚙️ Configuração de Secrets

Quando a conta for aprovada, configure os seguintes secrets:

### Secrets a Criar/Atualizar

```
ASAAS_API_KEY=sua_chave_de_producao_aqui
ASAAS_ENVIRONMENT=production
ASAAS_BASE_URL=https://api.asaas.com/v3
```

**Manter os secrets de sandbox** (para testes futuros):
```
ASAAS_SANDBOX_API_KEY=sua_chave_sandbox
```

## 🔗 Configuração do Webhook no Asaas

Após ativar produção, configure o webhook:

### No Painel Asaas (Produção)

1. Vá em **Integrações → Webhooks**
2. Clique em **Adicionar Webhook**
3. Configure:

| Campo | Valor |
|-------|-------|
| URL | `https://bykqurgeptipguqvxwiq.supabase.co/functions/v1/billing-webhook` |
| Eventos | `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_CREATED`, `PAYMENT_DELETED` |
| Versão | v3 |
| Status | Ativo |

4. **IMPORTANTE:** Adicione o header customizado:
   - Key: `Authorization`
   - Value: `Bearer [ASAAS_WEBHOOK_TOKEN]`

   (Use o mesmo token salvo nos secrets do projeto)

5. Clique em **Salvar**

### Testar Webhook

```bash
curl -X POST https://bykqurgeptipguqvxwiq.supabase.co/functions/v1/billing-webhook \
  -H "Authorization: Bearer [SEU_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CREATED",
    "payment": {
      "id": "pay_test_123",
      "customer": "cus_test_123",
      "value": 100.00,
      "status": "PENDING"
    }
  }'
```

Deve retornar: `200 OK`

## 🧪 Teste de Cobrança Real

Após a migração, faça um teste com valor mínimo:

### Criar Cobrança de R$ 5,00

1. No dashboard do DeclaraIR:
   - Crie um cliente de teste (use seu CPF)
   - Gere uma cobrança de **R$ 5,00**
   - Vencimento: amanhã

2. Verifique no Asaas:
   - Cobrança apareceu no painel?
   - Link de pagamento funciona?

3. Efetue o pagamento via Pix

4. Aguarde o webhook (2-5 minutos)

5. Verifique no DeclaraIR:
   - Status mudou para "Recebido"?
   - Notificação foi criada?

**Se todos os passos funcionaram: ✅ Migração concluída!**

## ⚠️ Diferenças Sandbox vs Produção

| Aspecto | Sandbox | Produção |
|---------|---------|----------|
| Pagamentos | Simulados | Reais (dinheiro real!) |
| Webhooks | Instantâneos | 2-5 min de delay |
| Valor mínimo | R$ 0,01 | R$ 5,00 |
| Logs de API | Sem delay | Até 5 min de delay |
| Taxa Asaas | 0% | 1,5% a 4,5% (por transação) |

## 🔄 Rollback para Sandbox

Se precisar voltar ao sandbox temporariamente:
```
ASAAS_ENVIRONMENT=sandbox
```

O sistema volta a usar a chave sandbox automaticamente.

## 🆘 Troubleshooting

### "Pagamento não atualiza status"

1. Verifique logs da edge function `billing-webhook`
2. Confirme que o token está correto
3. Veja se o webhook está ativo no Asaas

### "Cobrança não aparece no Asaas"

1. Verifique logs da edge function `billing-service`
2. Confirme que `ASAAS_API_KEY` está correto
3. Teste chamar a API manualmente com curl

### "Erro 401 Unauthorized"

- Verifique se a chave de produção está correta
- Confirme que `ASAAS_ENVIRONMENT=production`

## 📞 Contato Asaas

**Suporte:** suporte@asaas.com
**Telefone:** (31) 3349-4660
**Horário:** Seg-Sex, 8h-18h

---

**Status:** Aguardando aprovação da conta
**Última atualização:** Março/2026
