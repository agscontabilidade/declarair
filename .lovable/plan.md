# Trava de novos cadastros de clientes (deadline IRPF)

## Objetivo
A partir de **26/05/2026 19:00 (horário de Brasília)**, **bloquear a criação de novos clientes** em toda a plataforma. Clientes que já existem continuam usando o sistema 100% normal (upload de documentos, formulário, chat, etc.).

## Escopo do bloqueio
Os 3 caminhos que criam um cliente novo são fechados:
1. **Botão "Novo cliente"** em `/clientes` (modal `ClienteModal`) — disabled + tooltip explicativo.
2. **Geração de link de convite** (`GerarLinkConvite`) — disabled + aviso.
3. **Auto-cadastro via link público** (`/cliente/convite/:token` e edge functions `register-from-invite` e `register-from-direct-invite`) — retorna erro amigável "Período de cadastros encerrado em 26/05 às 19:00. Fale com seu contador."

Tudo o mais (login de cliente existente, upload, formulário IR, criação de declarações, envio de email, etc.) **continua funcionando normalmente**.

## Defesa em camadas (à prova de erro)

### Camada 1 — Banco (trigger BEFORE INSERT em `clientes`)
Trigger lê `system_configs.key='novos_cadastros_bloqueio'`. Se `enabled=true` e `now() >= deadline`, levanta exceção `NOVOS_CADASTROS_BLOQUEADOS: <mensagem>`. Garante que **nenhum caminho** (incluindo edge functions com service role) crie cliente depois do prazo.

Service role **não** é bypassado de propósito — queremos que até as edge functions respeitem a trava. (Se no futuro precisar emergência, admin desliga via `system_configs`.)

### Camada 2 — Edge functions
`register-from-invite` e `register-from-direct-invite` consultam o flag antes de qualquer ação e retornam HTTP 403 com mensagem amigável. Evita criar usuário em `auth.users` desnecessariamente.

### Camada 3 — Frontend
- Hook `useNovosCadastrosBloqueio()` lê o config (cache 60s).
- `Clientes.tsx` (botão Novo Cliente): disabled + tooltip "Cadastros encerrados em 26/05 19:00".
- `GerarLinkConvite.tsx`: bloqueado com a mesma mensagem.
- `ConviteCliente.tsx` (página pública do convite): se o flag estiver ativo, mostra tela "Período de cadastro encerrado" em vez do formulário.
- **Banner global** no topo (apenas para contador/dono) avisando o prazo, baseado em `global_alert` ou no próprio flag.

## Configuração (via `system_configs`)
Nova chave:
```
key: 'novos_cadastros_bloqueio'
value: {
  "enabled": true,
  "deadline": "2026-05-26T19:00:00-03:00",
  "mensagem": "O cadastro de novos clientes está encerrado desde 26/05/2026 às 19h00 (horário de Brasília), respeitando o prazo final do IRPF. Clientes já cadastrados continuam com acesso normal."
}
category: 'system'
```
Admin (contato@agscont.com.br) pode alterar/desligar pelo backoffice se precisar (RLS atual de `system_configs` já restringe a admin).

## Arquivos afetados
- **Migration**: cria a config + trigger `enforce_novos_cadastros_bloqueio()` em `public.clientes`.
- **Edge functions**: `register-from-invite/index.ts` e `register-from-direct-invite/index.ts` — checagem inicial do flag.
- **Frontend**:
  - `src/hooks/useNovosCadastrosBloqueio.ts` (novo).
  - `src/pages/Clientes.tsx` — disable botão + tooltip.
  - `src/components/clientes/ClienteModal.tsx` — fail-safe (não abre se bloqueado).
  - `src/components/clientes/GerarLinkConvite.tsx` — disable + aviso.
  - `src/pages/cliente/ConviteCliente.tsx` — tela de prazo encerrado.
  - Banner no `AppLayout` (ou onde já existe banner de `global_alert`).

## Fora de escopo (confirmado pelo seu próprio pedido)
- Upload de documentos por clientes existentes — **NÃO mexer**.
- Formulário IR, declarações, chat, cobranças — **NÃO mexer**.
- Convites de colaboradores (contadores do time) — **NÃO afetado**.

## Confirme antes de eu implementar
1. **Fuso/horário** — confirmo `2026-05-26 19:00 America/Sao_Paulo` (UTC-3). OK?
2. **Mensagem padrão** acima está boa ou quer ajustar o texto?
3. **Início ativado já**? Posso deixar `enabled=true` com a deadline acima, então o bloqueio só começa às 19:00 automaticamente. (Recomendado.)
