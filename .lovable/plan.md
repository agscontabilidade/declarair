

# Plano — Redesign da Capa IR + Perfil do Usuário Logado

## 1. Redesign da Capa IR (`src/pages/Capa.tsx`)

**Referência**: A capa PDF do AGSCont tem layout profissional com fundo gradiente azul escuro/azul, formas geométricas decorativas (retângulos arredondados), logo no topo, título grande "IMPOSTO DE RENDA 2025", nome do cliente em destaque, contador, e rodapé com telefone/email/endereço.

**O que mudar no preview da capa:**

- Substituir o card branco simples por um layout A4 vertical (aspect-ratio 210/297) com fundo gradiente navy → azul (`from-[#1a2a4a] via-[#1e3a6e] to-[#2563eb]`)
- Adicionar formas geométricas decorativas (rounded-rect outlines) posicionadas com absolute nas bordas (canto superior direito, inferior esquerdo, centro direito) — puro CSS/divs
- Logo do escritório no topo esquerdo (grande, com fallback para nome)
- Título "IMPOSTO DE RENDA {ano}" em fonte bold branca com o ano em cor accent/cyan
- Nome do cliente centralizado, grande, branco
- Seção "Contador(a): NOME" alinhada à esquerda
- Rodapé com ícones de telefone, email e endereço do escritório (buscar da tabela `escritorios`)
- Adicionar campos no formulário: telefone e email do escritório (pré-preenchidos do cadastro)
- CSS `@media print` para garantir que a capa imprima em A4 perfeita, sem header/sidebar, com cores mantidas (`-webkit-print-color-adjust: exact`)

**Formulário (lado esquerdo) — melhorias:**
- Adicionar campos: Telefone e Email do escritório
- Manter auto-preenchimento ao selecionar cliente
- Buscar dados do escritório (telefone, email) automaticamente

## 2. Página de Perfil do Usuário Logado

**Referência**: A imagem mostra a aba "Usuários" em Configurações com uma tabela básica. O pedido é ter uma configuração completa do perfil individual.

**Criar nova rota `/perfil` ou expandir o footer da sidebar:**

Ao clicar no avatar/nome no footer da sidebar, abrir página `/perfil` com:

- **Card "Meu Perfil"**: Avatar (iniciais), nome, email, papel (badge), status
- **Dados pessoais editáveis**: Nome completo, email (readonly, vem do auth), telefone
- **Seção "Minhas Declarações"**: Lista das declarações atribuídas ao contador logado, com status e link direto
- **Seção "Permissões"**: Exibição visual do nível de acesso (Dono/Admin/Contador/Operador) com lista de o que pode e não pode fazer
- **Seção "Atividade Recente"**: Últimas ações (declarações movidas, documentos aprovados)
- **Botão "Alterar Senha"**: Redireciona para fluxo de recuperação

**Arquivos:**
- Criar `src/pages/Perfil.tsx`
- Editar `src/components/layout/Sidebar.tsx` — link no avatar/nome para `/perfil`
- Editar `src/App.tsx` — adicionar rota `/perfil`

## Resumo de Entregas

| Entrega | Arquivo | Complexidade |
|---------|---------|-------------|
| Capa redesenhada estilo profissional | `src/pages/Capa.tsx` | Média |
| CSS print otimizado para A4 | `src/pages/Capa.tsx` + `src/App.css` | Baixa |
| Página de perfil do usuário | `src/pages/Perfil.tsx` (novo) | Média |
| Rota + sidebar link | `App.tsx` + `Sidebar.tsx` | Baixa |

