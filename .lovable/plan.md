

# Plano — Completar a Plataforma DeclaraIR

## Resumo

7 blocos de correções e melhorias para tornar a plataforma 100% funcional. Nenhuma alteração de layout ou design system.

---

## Bloco A — Modal "Nova Declaração" no Dashboard

**Arquivo: `src/pages/Dashboard.tsx`**

Adicionar estado `showNovaDeclaracao`, botão "Nova Declaração" no header ao lado do select de ano, e um modal inline (Dialog) com:
- Select de cliente (query `clientes` do escritório)
- Select de ano base (2023-2025)
- Select de contador responsável (query `usuarios` do escritório)

Ao salvar:
1. INSERT em `declaracoes` (cliente_id, escritorio_id, contador_id, ano_base, status='aguardando_documentos')
2. INSERT em massa em `checklist_documentos` com os 10 itens padrão especificados
3. INSERT em `formulario_ir` (declaracao_id, cliente_id, ano_base, status_preenchimento='nao_iniciado')
4. Fechar modal, toast sucesso, invalidar queries

Usa `supabase` diretamente no handler (mesmo padrão de `useClientePerfil.criarDeclaracao`). Importa `useClientes` para lista de clientes e `useQuery` para contadores.

---

## Bloco B — Portal do Cliente Dashboard (dados reais)

**Arquivo: `src/pages/cliente/ClienteDashboard.tsx`**

O arquivo já usa `useClientePortal` que busca dados reais (declaração, checklist, formulário). Análise mostra que está **já conectado** corretamente:
- `statusStep` calculado dinamicamente do status real
- `pendentes` filtrado do checklist real
- Empty state quando sem declaração
- Skeleton durante loading

**Ajuste necessário**: No card "Formulário IR", quando `formulario?.status_preenchimento === 'concluido'`, trocar texto para "Formulário Enviado ✓" e desabilitar o `onClick` de navegação. Atualmente o card é clicável independente do status.

---

## Bloco C — Fix do Formulário IR (salvamento)

**Arquivo: `src/hooks/useFormularioIR.ts`**

O hook já está correto — cria formulário com `cliente_id`, `declaracao_id`, `ano_base` (todos obrigatórios na tabela). O `saveToDb` faz UPDATE com o campo correto via `updateField(field, value)`. A interface `FormularioData` mapeia diretamente para as colunas do banco.

**Nenhuma mudança necessária** — os campos já salvam nas colunas corretas (estado_civil, conjuge_nome, dependentes jsonb, etc.). O autosave com debounce 1.5s já funciona.

---

## Bloco D — Declaração Detalhe (salvar resultado + ver formulário)

**Arquivo: `src/pages/DeclaracaoDetalhe.tsx`**

Já implementado corretamente:
- `SecaoResultado` usa `useState` com `useEffect` para sincronizar (linhas 18-26 do componente)
- `SecaoFormularioIR` mostra dados em acordeões quando concluído
- `SecaoNotas` com autosave debounce 2s
- `DeclaracaoHeader` com breadcrumb e dropdown de status

**Nenhuma mudança necessária** — os componentes já estão conectados ao hook `useDeclaracao` que faz UPDATE real.

---

## Bloco E — Configurações conectadas ao Supabase

**Arquivo: `src/pages/Configuracoes.tsx`** — Reescrever completamente

4 abas usando Tabs component:

**Aba Escritório:**
- `useQuery(['escritorio', escritorioId])` → SELECT de `escritorios`
- useState para cada campo (nome, email, telefone, cnpj)
- Botão "Salvar" → UPDATE `escritorios`

**Aba Usuários:**
- Reutilizar query de `usuarios` do escritório (mesma do `useClientes.contadores`)
- Tabela read-only: nome, email, papel, ativo (badge)

**Aba Plano:**
- Buscar `escritorio.plano` e `escritorio.limite_declaracoes`
- Count de declarações do ano corrente: `SELECT count(*) FROM declaracoes WHERE escritorio_id AND ano_base = currentYear`
- Mostrar uso: "X de Y declarações usadas"

**Aba Integrações:** Manter placeholder "Em breve"

---

## Bloco F — Gerador de Capa com auto-fill

Não existe nenhuma página de Capa no projeto (não há rota `/capa` no App.tsx, nem arquivo). A sidebar referencia `/capa` mas leva a 404.

**Criar `src/pages/Capa.tsx`** — Página de geração de capa para declarações IRPF:
- Select "Selecionar Cliente" que auto-preenche nome e CPF
- Buscar nome do escritório do Supabase
- Campos: nomeCliente, cpfCliente, anoBase, nomeEscritorio, nomeContador
- Input de logo com preview via `URL.createObjectURL`
- Preview visual da capa em card estilizado
- Botão para imprimir (window.print)

**Adicionar rota `/capa`** no App.tsx (única mudança no App.tsx)

---

## Bloco G — Polimento Geral

| Mudança | Arquivo |
|---------|---------|
| `overflow-x-auto` no container do grid do kanban | `src/components/dashboard/KanbanBoard.tsx` |
| NotFound em português | `src/pages/NotFound.tsx` |
| Footer do login © 2025–2026 | `src/pages/Login.tsx` (não tem footer atualmente, adicionar) |
| Formulário IR card desabilitado quando concluído | `src/pages/cliente/ClienteDashboard.tsx` |

---

## Resumo de Arquivos

**Criar:**
- `src/pages/Capa.tsx`

**Modificar:**
- `src/pages/Dashboard.tsx` — adicionar modal nova declaração
- `src/pages/Configuracoes.tsx` — reescrever com 4 abas conectadas
- `src/pages/cliente/ClienteDashboard.tsx` — ajuste card formulário concluído
- `src/components/dashboard/KanbanBoard.tsx` — overflow-x-auto
- `src/pages/NotFound.tsx` — traduzir para português
- `src/pages/Login.tsx` — footer com ano
- `src/App.tsx` — adicionar rota `/capa` (única adição)

**Não modificar:** AuthContext, Sidebar, Header, DashboardLayout, hooks existentes, componentes de formulário IR, declaração detalhe, client portal.

