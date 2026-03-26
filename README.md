# DeclaraIR

Sistema completo de gestão de declarações de Imposto de Renda para escritórios de contabilidade.

## 🚀 Features

### Para Escritórios de Contabilidade
- ✅ Gestão de clientes e declarações IRPF
- ✅ Kanban visual com status das declarações
- ✅ Cálculo automático de IR (Completo + Simplificado)
- ✅ Portal do cliente com upload de documentos
- ✅ Geração de cobranças integrado com Asaas
- ✅ Notificações automáticas (email + WhatsApp)
- ✅ Chat em tempo real com clientes
- ✅ Checklist de documentos obrigatórios
- ✅ Relatórios e dashboards financeiros

### Para Clientes
- ✅ Portal dedicado para acompanhar declaração
- ✅ Upload de documentos com validação
- ✅ Visualização do status em tempo real
- ✅ Chat direto com o contador
- ✅ Acesso a cobranças e pagamentos

## 🏗️ Arquitetura

**Stack:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Edge Functions)
- Autenticação: Supabase Auth (JWT)
- Pagamentos: Asaas (Boleto + Pix)
- Storage: Supabase Storage (documentos criptografados)
- Email: Resend (transacional)
- WhatsApp: Evolution API

**Segurança:**
- ✅ RLS (Row Level Security) em todas as 20 tabelas
- ✅ 73 policies de acesso implementadas
- ✅ Multi-tenancy isolado por escritório
- ✅ Criptografia de dados sensíveis
- ✅ Validação de dados com Zod
- ✅ TypeScript strict mode

## 🗄️ Modelo de Dados

**Tabelas principais:**
- `escritorios` - Escritórios de contabilidade
- `usuarios` - Contadores e colaboradores
- `clientes` - Clientes do escritório
- `declaracoes` - Declarações IRPF
- `formulario_ir` - Dados do formulário (JSONB)
- `cobrancas` - Gestão financeira
- `checklist_documentos` - Arquivos dos clientes
- `mensagens_chat` - Chat em tempo real
- `notificacoes` - Sistema de notificações

## 🚀 Deploy

**Pré-requisitos:**
- Conta no Lovable Cloud (para frontend)
- Conta no Supabase (para backend)
- Conta no Asaas (para pagamentos)
- Domínio próprio (opcional)

**Passos:**
1. Fazer fork/clone do projeto
2. Configurar secrets no Supabase
3. Aplicar migrations SQL (pasta `supabase/migrations/`)
4. Fazer deploy das edge functions
5. Configurar webhook no Asaas
6. Publicar frontend no Lovable

Veja `DEPLOY_PROCEDURE.md` para o passo a passo completo.

## 🧪 Testes

**Executar testes:**
```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📊 Monitoramento

- Sentry: Error tracking e performance
- Supabase Dashboard: Logs de edge functions
- Tabela `system_logs`: Auditoria de operações críticas

## 🔐 Segurança

**RLS (Row Level Security):**
Todas as tabelas têm políticas de acesso baseadas em:
- `get_user_escritorio_id()` - Isola dados por escritório
- `get_user_cliente_id()` - Isola dados do cliente no portal

**Validação:**
- Todos os inputs validados com Zod schemas
- Edge functions validam JWT e ownership
- Webhooks autenticados com token secreto

## 📱 Responsividade

✅ Mobile-first (375px+)
✅ Tablet (768px+)
✅ Desktop (1024px+)

## 📄 Licença

Proprietário - AGSContabilidade © 2026

## 🆘 Suporte

Para dúvidas ou problemas, abra uma issue no repositório interno.

---

**Versão:** 1.0.0
**Última atualização:** Março/2026
