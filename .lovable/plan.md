## Objetivo

Reformular a tela `/clientes` (lado contador) para:
1. Nova ordem de colunas: CPF, Nome, WhatsApp, Procuração e-CAC.
2. Ações limpas em cada linha (excluir, editar, WhatsApp).
3. Clique na linha abre modal com dados cadastrais + resumo de cobranças/pagamentos.
4. Suporte a marcar se o cliente tem procuração e-CAC ativa.

---

## 1. Banco de dados

A tabela `clientes` não tem hoje campo para procuração e-CAC. Criar migration adicionando:

- `procuracao_ecac` (boolean, default `false`, not null) — indica se o cliente já cadastrou a procuração eletrônica no e-CAC.
- `procuracao_ecac_validade` (date, nullable) — opcional, data limite (procurações e-CAC valem até 5 anos), para alerta futuro.

A coluna entra nas RLS já existentes (sem alteração de policies).

---

## 2. Tabela de clientes (`src/components/clientes/ClientesTable.tsx`)

Nova ordem e conteúdo de colunas:

| Coluna | Conteúdo |
|---|---|
| CPF | `formatCPF(c.cpf)`, tabular-nums |
| Nome | `c.nome`, font-medium |
| WhatsApp | telefone formatado `(00) 00000-0000` ou `—` |
| Procuração e-CAC | Badge verde "Ativa" se `procuracao_ecac=true`, badge cinza "Pendente" caso contrário |
| Ações | 3 ícones: WhatsApp, Editar (lápis), Excluir (lixeira) |

Mudanças nas ações (canto direito):
- Remover ícone de olho (`Eye`).
- Remover ícone de dinheiro (`DollarSign`).
- Substituir balão de conversa (`MessageCircle`) pelo ícone do WhatsApp — usar SVG inline da marca (lucide não tem oficial), abrindo `https://wa.me/55<telefone>`.
- Adicionar ícone Lápis (`Pencil`) → dispara callback `onEdit(cliente)`.
- Adicionar ícone Lixeira (`Trash2`) com `AlertDialog` de confirmação → dispara `onDelete(cliente)`.

A linha inteira (`<TableRow>`) recebe `onClick` que dispara `onView(cliente)`. Ações usam `e.stopPropagation()` para não abrir o modal de visualização. `cursor-pointer` + `hover:bg-muted/40`.

Coluna de Onboarding e coluna de Email saem desta tela (passam a viver dentro do modal de detalhes para não poluir).

Remoção do `useNavigate` para `/clientes/:id` na tabela — abrir o modal substitui a navegação.

---

## 3. Hook `src/hooks/useClientes.ts`

Acrescentar:

- Selecionar `procuracao_ecac, procuracao_ecac_validade` no `select`.
- `updateCliente` (mutation): edita nome, email, telefone, data_nascimento, contador_responsavel_id, procuracao_ecac, procuracao_ecac_validade.
- `deleteCliente` (mutation): `.delete().eq('id', id)` — confia no `ON DELETE CASCADE` já existente em declarações, cobranças, formulário etc. Invalida `['clientes']`, `['dashboard-kpis']`, `['dashboard-declaracoes']`, `['declaracoes']`.

---

## 4. Modal de visualização (novo)

`src/components/clientes/ClienteViewModal.tsx`

Aberto ao clicar na linha. Conteúdo (somente leitura, layout em duas colunas, tipografia da marca):

- **Cabeçalho**: nome do cliente + Badge de status_onboarding + Badge de Procuração e-CAC.
- **Bloco Dados cadastrais**: CPF, Email, WhatsApp (com link `wa.me`), Data de nascimento, Contador responsável, Data de cadastro.
- **Bloco Procuração e-CAC**: status (Ativa/Pendente) + validade (se houver).
- **Bloco Cobranças e pagamentos**: 
  - 3 mini-cards (Pago / Pendente / Atrasado) reutilizando os totais do `AbaCobrancas` (extraídos para função utilitária `getCobrancasResumo` em `src/lib/formatters.ts` ou local).
  - Lista compacta das últimas 5 cobranças (descrição, valor, vencimento, status badge).
  - Botão "Ver todas as cobranças" → navega para `/clientes/:id` aba Cobranças (mantém perfil completo existente).
- **Rodapé**: Botão "Editar" (abre o modal de edição), Botão "Abrir perfil completo" (navega `/clientes/:id`), Botão "Fechar".

Dados de cobranças carregados via novo hook leve `useCobrancasCliente(clienteId)` (query `cobrancas` filtrando por `cliente_id`, limit 5 + counts/aggregations).

---

## 5. Modal de edição

Refatorar `src/components/clientes/ClienteModal.tsx` para suportar dois modos:

- `mode="create"` (já existente).
- `mode="edit"` recebe `cliente` inicial e chama `onSave` que internamente decide create vs update.

Campos editáveis:
- Nome, Email, WhatsApp, Data de nascimento, Contador responsável.
- **Switch** "Cliente possui procuração e-CAC ativa" (`Switch` do shadcn).
- Se ligado, mostrar `Input type="date"` para validade (opcional).
- CPF mantido como somente leitura no modo edição (chave fiscal).

Título do dialog muda conforme o modo ("Novo Cliente" / "Editar Cliente").

---

## 6. Modal de exclusão

Usar `AlertDialog` inline na linha, mensagem:

> Excluir definitivamente o cliente "{nome}"? Todos os dados vinculados (declarações, documentos, cobranças, mensagens) serão removidos. Esta ação não pode ser desfeita.

Confirmação chama `deleteCliente.mutateAsync(id)` + toast.

---

## 7. Página `src/pages/Clientes.tsx`

- Estados novos: `viewCliente`, `editCliente` (Cliente | null).
- Passar `onView`, `onEdit`, `onDelete` para `ClientesTable`.
- Renderizar `ClienteViewModal`, `ClienteModal` (modo edit), e o modal de criação já existente.
- Permissões: editar/excluir respeitam `usePermissoes` (provavelmente `podeCriarClientes`; confirmar e usar a flag adequada).

---

## 8. Detalhes técnicos

- Ícone WhatsApp: SVG inline (24x24) já que lucide não inclui o logo oficial; usar `currentColor`.
- Acessibilidade: `aria-label` em todos os ícones de ação, `role="button"` na linha clicável + `tabIndex={0}` + handler de teclado (Enter).
- Não tocar em `src/integrations/supabase/client.ts` nem `types.ts` (regenerados após migration).
- Página de perfil existente (`/clientes/:id`) é mantida intacta — fica acessível pelo botão "Abrir perfil completo" no modal e por deep links.

---

## Arquivos afetados

```text
NOVO  src/components/clientes/ClienteViewModal.tsx
NOVO  src/hooks/useCobrancasCliente.ts
EDIT  src/components/clientes/ClientesTable.tsx        (colunas, ícones, click linha)
EDIT  src/components/clientes/ClienteModal.tsx         (suporte a modo edit + procuração)
EDIT  src/hooks/useClientes.ts                         (select, update, delete)
EDIT  src/pages/Clientes.tsx                           (estados + novos modais)
MIGR  add column procuracao_ecac (bool) + procuracao_ecac_validade (date)
```
