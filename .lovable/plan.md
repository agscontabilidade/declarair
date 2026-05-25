## Objetivo

Substituir o botão único "Gerar Link de Convite" (link genérico de autocadastro) por uma **ação inteligente por cliente** na tabela `/clientes`, que reflete o estado real de cada contribuinte. Assim o convite vira parte natural do ciclo de vida do cliente, e não uma ação paralela.

## Comportamento do botão (por linha)

Lê `clientes.status_onboarding`, `clientes.token_convite_expira_em` e `clientes.auth_user_id`:

| Estado | Ícone | Tooltip | Ação |
|---|---|---|---|
| `nao_iniciado` (sem token) | `Send` | "Enviar convite de acesso" | Abre `EnviarConviteClienteDialog` (gera novo token) |
| `convite_enviado` + token válido | `Link2` (cor `primary`) | "Convite pendente — reenviar ou copiar link" | Abre dialog **sem regerar** o token (reusa o existente) |
| `convite_enviado` + token expirado | `RefreshCw` (cor `amber`) | "Convite expirado — gerar novo" | Abre dialog gerando novo token |
| `em_andamento` ou `concluido` (tem `auth_user_id`) | `CheckCircle2` (cor `emerald`, sutil) | "Portal ativo — reenviar acesso" | Abre dialog gerando novo token (caso cliente tenha perdido) |

Botão fica entre o "Nova cobrança" ($) e o WhatsApp na coluna de ações.

## Mudanças

### 1. `src/components/clientes/EnviarConviteClienteDialog.tsx`

Aceitar reuso de token existente:
- Estender `EnviarConviteClienteCtx` com `mode: 'novo' | 'reusar'` e `tokenExistente?: string | null`.
- Se `mode === 'reusar'` e `tokenExistente` presente: pular o `update` e montar o link direto.
- Caso contrário: gerar novo token (comportamento atual).
- Ajustar título do dialog conforme `mode` ("Enviar convite" vs "Reenviar convite").

### 2. `src/components/clientes/ClientesTable.tsx`

- Nova prop `onConvite?: (cliente: ClienteRow) => void`.
- Renderizar o botão com ícone/cor/tooltip dinâmicos via helper local `getConviteState(cliente)` retornando `{ icon, tooltip, variant }`.
- Importar `Send`, `Link2`, `RefreshCw`, `CheckCircle2` do lucide-react.

### 3. `src/pages/Clientes.tsx`

- Implementar handler `onConvite` que monta `EnviarConviteClienteCtx` com `mode` correto e `tokenExistente` (quando `convite_enviado` + não expirado), e seta `conviteCtx`.
- **Remover** `<GerarLinkConvite />` do header da página (a ação agora vive por linha).
- Manter o componente/arquivo `GerarLinkConvite.tsx` no projeto (não deletar) — pode ser reativado depois se quiserem o fluxo de link reutilizável de autocadastro em massa.

### 4. Tipos

`SavedClienteResult` e `onSavedAndInvite` (já existentes) continuam iguais — fluxo de "Novo Cliente + convite" segue funcionando, agora chamando o dialog em modo `novo`.

## Fora de escopo

- Schema, RLS, edge functions.
- Modal de edição de cliente.
- Página `/clientes/:id` (header de convite lá continua igual).
- Fluxo de autocadastro genérico (`convites_cliente` + `/cadastro-cliente/:token`) — preservado, só não exposto mais no header.

## Por que remover o botão de header

O link genérico criava um caminho paralelo (cliente se autocadastra → contador precisa conciliar depois). Com o convite per-row, todo cliente nasce já no CRM e o link entrega o portal direto, sem etapa de match. Mantemos o código vivo para reativação futura sem custo.
