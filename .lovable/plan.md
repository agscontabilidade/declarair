

# DeclaraIR - Plano de Implementação (Passo 1-4)

Este plano cobre a fundação completa: banco de dados, autenticação, RLS e design system.

---

## Passo 1 — Banco de Dados (Lovable Cloud)

Habilitar Lovable Cloud e criar **10 tabelas** via migrações SQL:

1. `escritorios` — dados do escritório contábil
2. `usuarios` — contadores/donos (FK para auth.users)
3. `clientes` — clientes do escritório com token de convite
4. `declaracoes` — declarações IRPF com status kanban
5. `checklist_documentos` — documentos necessários por declaração
6. `formulario_ir` — formulário IR com campos JSONB (unique por declaração)
7. `cobrancas` — cobranças vinculadas a cliente/declaração
8. `templates_mensagem` — templates de email/whatsapp
9. `mensagens_enviadas` — log de mensagens enviadas

Adicionalmente:
- Tabela `user_roles` com enum `app_role` (dono, colaborador) para controle de acesso seguro via função `has_role()` security definer
- Storage bucket `documentos-clientes` para uploads

Duas funções security definer auxiliares:
- `buscar_cliente_por_token(token)` — busca cliente sem RLS (para convite)
- `limpar_token_convite(cliente_id)` — limpa token após aceite

## Passo 2 — Autenticação

**Arquivos a criar:**

| Arquivo | Descrição |
|---------|-----------|
| `src/integrations/supabase/client.ts` | Cliente Supabase |
| `src/contexts/AuthContext.tsx` | Provider com session + perfil do usuário (tipo, escritorio_id, papel) |
| `src/hooks/useAuth.ts` | Hook de conveniência |
| `src/pages/Login.tsx` | Login/cadastro do contador com abas |
| `src/pages/cliente/ClienteLogin.tsx` | Login do cliente |
| `src/pages/cliente/ConviteCliente.tsx` | Aceite de convite com criação de senha |
| `src/components/ProtectedRoute.tsx` | Guard de rotas por tipo de usuário |

**Fluxo Contador:**
- Cadastro: cria `escritorios` + `usuarios` (papel=dono) na mesma transação
- Login: busca `usuarios` para metadata (escritorio_id, papel)
- Redireciona para `/dashboard`

**Fluxo Cliente:**
- Convite: busca via `buscar_cliente_por_token()`, cria conta com metadata `{tipo:'cliente', cliente_id}`
- Login: verifica metadata tipo=cliente, redireciona `/cliente/dashboard`

**Rotas em App.tsx:**
- `/login`, `/cliente/login`, `/cliente/convite/:token` — públicas
- `/dashboard`, `/clientes`, `/clientes/:id`, `/declaracoes/:id`, `/cobrancas`, `/mensagens`, `/capa`, `/configuracoes` — ProtectedRoute tipo=contador
- `/cliente/dashboard`, `/cliente/formulario`, `/cliente/documentos` — ProtectedRoute tipo=cliente
- `/` — redirect baseado no tipo

## Passo 3 — RLS

Ativar RLS em todas as tabelas. Políticas principais:

- **escritorios**: SELECT/UPDATE onde `id` está no escritório do usuário autenticado (via `usuarios`)
- **usuarios**: SELECT para mesmo escritório; INSERT/UPDATE apenas quem tem role `dono`
- **clientes, declaracoes, cobrancas, checklist_documentos, templates_mensagem, mensagens_enviadas**: CRUD completo filtrado por `escritorio_id` do usuário
- **formulario_ir**: SELECT para contador do escritório; INSERT/UPDATE para cliente owner (via JWT metadata `cliente_id`)

Função `get_user_escritorio_id()` security definer para evitar recursão.

## Passo 4 — Design System

**CSS Variables (index.css):**
- `--primary`: Navy #1E3A5F (hsl 213 52% 24%)
- `--accent`: #3B82F6 (hsl 217 91% 60%)
- `--sidebar-background`: #142840 (hsl 213 52% 17%)
- `--background`: #F8FAFC
- Success #10B981, Warning #F59E0B, Destructive #EF4444

**Fontes (Google Fonts via index.html):**
- Syne (600-800) para títulos
- DM Sans (300-600) para corpo

**Layout base:**
- `src/components/layout/Sidebar.tsx` — 240px fixa, navy-dark, logo, navegação
- `src/components/layout/Header.tsx` — 60px, nome do usuário, escritório
- `src/components/layout/DashboardLayout.tsx` — wrapper sidebar+header+content
- `src/components/layout/ClienteLayout.tsx` — layout simplificado para portal do cliente

**Utilitários brasileiros:**
- `src/lib/formatters.ts` — formatCPF, formatDate, formatCurrency, parseCPF

**Páginas placeholder:**
- Dashboard, Clientes, Configurações (contador)
- ClienteDashboard (cliente)

---

## Detalhes Técnicos

**Migração SQL**: Uma única migração com todas as tabelas, enum, funções security definer e políticas RLS.

**Dependência**: Instalar `@supabase/supabase-js` via Lovable Cloud.

**Ordem de execução**: Migração → Auth context → Design system → Rotas → Páginas placeholder. Tudo no mesmo ciclo de implementação.

