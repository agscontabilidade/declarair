## Objetivo

Reverter o bloqueio que está afetando contadores e trocar por um bloqueio **somente no portal do cliente** para envio de documentos novos. Contador continua podendo cadastrar clientes e fazer upload normalmente.

## O que está errado hoje

Na rodada anterior, criamos:
- Config `novos_cadastros_bloqueio` em `system_configs`
- Trigger `trg_enforce_novos_cadastros_bloqueio` em `public.clientes` (BEFORE INSERT) → **isso bloqueia o contador de cadastrar clientes novos**
- Bloqueio nas Edge Functions `register-from-invite`
- UI: botões "Novo cliente" e "Gerar link de convite" desabilitados na tela do contador
- Tela "Cadastros encerrados" no `/cliente/convite/:token`

Tudo isso vai sair.

## Mudanças

### 1. Banco (migration)
- `DROP TRIGGER trg_enforce_novos_cadastros_bloqueio ON public.clientes` e `DROP FUNCTION enforce_novos_cadastros_bloqueio()`
- Renomear/substituir a chave em `system_configs` para `cliente_upload_bloqueado` com `{ enabled: true, deadline: "2026-05-26T19:00:00-03:00", mensagem: "..." }`. Manter `get_novos_cadastros_bloqueio()` apontando para a nova chave (rename interno) ou criar `get_cliente_upload_bloqueio()` e descontinuar a antiga.
- Nova função `enforce_cliente_upload_bloqueio()` + trigger BEFORE INSERT em `public.checklist_documentos` que só bloqueia quando:
  - `auth.uid()` corresponde a um registro em `public.clientes` (ou seja, `is_cliente() = true`)
  - **NÃO** bloqueia quando o INSERT vem de `usuarios` (contador) ou de `service_role`.
  - Bloqueia apenas se `enabled = true` e `now() >= deadline`.

### 2. Edge Functions
- `register-from-invite/index.ts`: remover o check de bloqueio (volta ao comportamento original).
- `register-from-direct-invite/index.ts`: já não tinha bloqueio, sem mudanças.

### 3. Frontend — Contador (reverter)
- `src/pages/Clientes.tsx`: remover banner, tooltip e `disabled` dos botões "Novo cliente" e "Gerar link".
- `src/components/clientes/GerarLinkConvite.tsx`: remover `disabled` e aviso.
- `src/pages/cliente/CadastroCliente.tsx`: remover tela "Cadastros encerrados" (esse fluxo é cadastro inicial do cliente via link — pode continuar funcionando; o bloqueio agora é só no upload).
- `src/hooks/useNovosCadastrosBloqueio.ts`: renomear para `useClienteUploadBloqueio.ts` (mesma estrutura, lê a nova chave).

### 4. Frontend — Portal do Cliente (novo bloqueio)
- `src/pages/cliente/ClienteDocumentos.tsx`:
  - Consumir `useClienteUploadBloqueio()`.
  - Banner amarelo no topo: "Período de envio de documentos encerrado em 26/05/2026 às 19:00. Entre em contato com seu contador."
  - Desabilitar input de arquivo / botão de upload (mostrar tooltip).
  - Guard no `handleUpload` retornando toast de erro caso o flag esteja ativo (defesa em profundidade, além do trigger no banco).
- `src/pages/cliente/ClienteDashboard.tsx`: banner equivalente (somente aviso, sem alterar lógica).

### 5. Fora de escopo (não muda)
- Cadastro de clientes pelo contador
- Cadastro do cliente via link de convite (`/cliente/convite/:token`) — continua liberado para finalizar conta
- Uploads feitos pelo contador em `AbaDocumentosUnificada`, declarações, IR, chat, cobranças
- Convites de colaborador

## Perguntas

1. Mantemos a deadline `2026-05-26 19:00 BRT` ou já ligamos agora (sem checar horário)?
2. Texto do aviso: "Período de envio de documentos encerrado. O prazo final da Receita está próximo — entre em contato com seu contador para qualquer pendência." — ok ou ajusta?
