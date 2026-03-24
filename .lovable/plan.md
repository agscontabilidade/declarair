

# Plano de Implementação — Gaps Restantes do DeclaraIR

## Auditoria: O Que Existe vs O Que Falta

### Implementado e Funcional
- Dashboard com Kanban + Lista + KPIs + seletor de ano
- Clientes CRUD + convite por token
- Declarações com status, documentos, formulário IR (steps/wizard)
- Cobranças com integração Inter (Edge Function)
- Templates de mensagem (email/whatsapp)
- Configurações do escritório (dados, equipe, integrações)
- Portal do cliente (login, dashboard, formulário, documentos)
- Cálculo comparativo IR (Simplificada vs Completa) com tabela 2026
- Checklist dinâmico por perfil fiscal (StepPerfilFiscal)
- Chat integrado contador ↔ cliente (Realtime)
- Chat flutuante no portal do cliente
- Timeline de auditoria por declaração
- Notificações in-app com bell dropdown (Realtime)
- Whitelabel UI (WhitelabelTab em configurações)
- Planos (UI com tabela comparativa)
- Recuperação de senha
- Permissões (dono vs colaborador)

### Parcialmente Implementado (precisa de correção/DB)
1. **Whitelabel** — UI existe mas colunas `cor_primaria`, `cor_fundo_portal`, `nome_portal`, `texto_boas_vindas`, `whitelabel_ativo`, `favicon_url` NÃO existem na tabela `escritorios` (tipos não estão no types.ts). Usa `as any`.
2. **Chat** — tabela `mensagens_chat` não existe no schema (usa `as any`). Precisa de migration.
3. **Timeline** — tabela `declaracao_atividades` não existe no schema (usa `as any`). Precisa de migration.
4. **Whitelabel no portal cliente** — não aplica cores/logo dinamicamente no portal.

### Completamente Ausente
1. **Bloco 1: Monitoramento de Malha Fina** — nenhuma implementação
2. **Bloco 5: Programa de Afiliados** — nenhuma implementação
3. **Bloco 8: Notificações automáticas por etapa do Kanban** — não há trigger/config por etapa
4. **Bloco 9: Controle de limites no backend** — colunas de plano incompletas
5. **Bloco 10: Histórico multi-ano** — sem timeline no perfil do cliente, sem pré-preenchimento
6. **Bloco 11: Gestão de equipe** — convite de usuário, papéis expandidos (admin/operador)
7. **Bloco 13: Relatório PDF** — sem geração de PDF
8. **Bloco 16: Melhorias técnicas** — sem Error Boundaries, sem PWA
9. **Bloco 17: Landing Page** — `Index.tsx` é placeholder vazio
10. **Drive do Contador** (`/drive`) — não existe
11. **Onboarding wizard** — não existe no projeto atual

---

## Plano de Implementação (por ordem de impacto)

### Etapa 1 — Corrigir DB e Fundações (Migration)

**Uma única migration SQL para:**

1. Criar tabela `mensagens_chat` com RLS (escritório + cliente)
2. Criar tabela `declaracao_atividades` com RLS
3. Adicionar colunas whitelabel ao `escritorios`: `cor_primaria`, `cor_fundo_portal`, `nome_portal`, `texto_boas_vindas`, `whitelabel_ativo` (boolean), `favicon_url`, `url_portal_customizada`
4. Adicionar colunas de plano ao `escritorios`: `declaracoes_utilizadas`, `storage_limite_mb`, `usuarios_limite`, `plano_expira_em`
5. Criar tabela `malha_fina_consultas` com índice
6. Criar tabela `declaracao_atividades` (se não existir)
7. Habilitar Realtime para `mensagens_chat`
8. Criar trigger para registrar mudanças de status em `declaracao_atividades` automaticamente

**Arquivos**: 1 migration SQL

---

### Etapa 2 — Landing Page (`/`)

Substituir `Index.tsx` (placeholder) por landing page completa:
- Hero com headline, subheadline, CTA "Começar grátis" + "Ver demonstração"
- Seção de números (métricas fictícias)
- Grid de 6 features com ícones
- Carrossel de depoimentos
- Tabela de preços (reutilizar dados de `Planos.tsx`)
- FAQ com Accordion (8 perguntas)
- Footer com links

**Arquivos**: `src/pages/Index.tsx` (reescrever)

---

### Etapa 3 — Monitoramento de Malha Fina

- Nova rota `/malha-fina` no menu sidebar
- Tabela com clientes que tiveram declaração transmitida
- Badges de status coloridos (Em Processamento, Processada, Em Malha, etc.)
- Modal de consulta individual (CPF + data nascimento → salva resultado)
- Botão "Consultar Todos" com barra de progresso
- Filtros por status e ano
- Seção "Status na RFB" no detalhe da declaração

**Nota**: A consulta real à Receita Federal requer integração externa (e-CAC/Serpro). Implementar como simulação/manual com possibilidade de futura Edge Function.

**Arquivos novos**: `src/pages/MalhaFina.tsx`, `src/hooks/useMalhaFina.ts`
**Editar**: `Sidebar.tsx` (add link), `App.tsx` (add rota), `DeclaracaoDetalhe.tsx` (add seção)

---

### Etapa 4 — Aplicar Whitelabel no Portal do Cliente

- No `ClienteLayout.tsx`, buscar configurações do escritório
- Aplicar `cor_primaria` como CSS variable `--color-brand`
- Exibir logo customizado no header
- Nome do escritório no título
- Texto de boas-vindas no `ClienteLogin.tsx`
- Ocultar branding DeclaraIR quando `whitelabel_ativo`

**Arquivos**: `src/components/layout/ClienteLayout.tsx`, `src/pages/cliente/ClienteLogin.tsx`

---

### Etapa 5 — Histórico Multi-Ano no Perfil do Cliente

- Nova seção "Histórico de Declarações" em `ClientePerfil.tsx`
- Timeline visual vertical por ano
- Status final, valor resultado, comparativo ano-a-ano
- Link para cada declaração

**Arquivos**: `src/components/cliente-perfil/AbaVisaoGeral.tsx` (adicionar timeline)

---

### Etapa 6 — Notificações Automáticas por Etapa

- Nova aba "Notificações" em `/configuracoes`
- Grid: etapa do Kanban × canal (email cliente, email contador)
- Toggle on/off + editar template por etapa
- Templates padrão pré-carregados
- Lógica: ao mudar status da declaração, verificar config e enviar

**Arquivos novos**: `src/components/configuracoes/NotificacoesTab.tsx`
**Editar**: `src/pages/Configuracoes.tsx`

---

### Etapa 7 — Drive do Contador

- Nova rota `/drive` no sidebar
- Visualização em árvore: Ano > Cliente > Categoria
- Busca por nome, CPF
- Preview de PDFs/imagens inline
- Download em lote (ZIP por cliente)
- Indicador de storage usado vs limite

**Arquivos novos**: `src/pages/Drive.tsx`
**Editar**: `Sidebar.tsx`, `App.tsx`

---

### Etapa 8 — Gestão de Equipe Expandida

- Expandir aba "Equipe" em configurações com papéis: Dono, Administrador, Contador, Operador
- Botão "Convidar usuário" com envio de email
- Filtro "Minhas declarações" vs "Todas" no Kanban
- Atribuição de responsável no detalhe da declaração

**Arquivos**: `src/pages/Configuracoes.tsx` (aba equipe), `src/pages/Dashboard.tsx` (filtro)

---

### Etapa 9 — Relatório PDF para o Cliente

- Botão "Gerar relatório" no detalhe da declaração (aba Resultado)
- PDF com: capa (logo, nome, CPF), resumo executivo, detalhamento do cálculo, orientações
- Usar `@react-pdf/renderer`
- Botão "Enviar por email"

**Arquivos novos**: `src/components/declaracao/RelatorioPDF.tsx`
**Editar**: `DeclaracaoDetalhe.tsx`

---

### Etapa 10 — Melhorias Técnicas

- Error Boundary global com fallback elegante
- Skeleton screens em todas as listas (maioria já tem)
- Índices SQL para queries comuns

**Arquivos novos**: `src/components/ErrorBoundary.tsx`
**Editar**: `App.tsx`

---

## Fora de Escopo (requer infraestrutura externa)

- **Programa de Afiliados** (Bloco 5) — requer sistema de pagamento e tracking; pode ser implementado como UI mas sem backend de comissões real
- **PWA** — requer `vite-plugin-pwa` e configuração de service worker
- **WhatsApp real** — requer Evolution API / Z-API
- **Exportação PGD (.DED)** — formato proprietário da Receita Federal
- **Onboarding wizard** — baixa prioridade, pode ser adicionado depois

---

## Resumo de Prioridades

| Etapa | Bloco | Impacto | Complexidade |
|-------|-------|---------|-------------|
| 1 | DB/Migrations | Fundação | Baixa |
| 2 | Landing Page | Conversão | Média |
| 3 | Malha Fina | Diferencial competitivo | Alta |
| 4 | Whitelabel Portal | Paridade competitiva | Baixa |
| 5 | Histórico Multi-Ano | UX | Média |
| 6 | Notificações por Etapa | Automação | Média |
| 7 | Drive Contador | Produtividade | Alta |
| 8 | Gestão Equipe | Escala | Média |
| 9 | Relatório PDF | Valor percebido | Média |
| 10 | Melhorias Técnicas | Qualidade | Baixa |

Recomendo implementar em 2-3 ciclos: **Etapas 1-4** primeiro (fundação + maior impacto), depois **5-7**, e finalmente **8-10**.

