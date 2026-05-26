## Causa raiz

O dialog `EnviarConviteClienteDialog` re-executa o `useEffect` várias vezes porque a prop `onClose` é uma arrow function nova a cada render do `<Clientes>`. Cada execução gera um UUID novo e roda um `UPDATE` em `clientes`. Quando as promises terminam fora de ordem, o `link` exibido no modal aponta para um UUID que **não é** o que ficou no banco — daí o "Convite Inválido" ao abrir.

Confirmado no banco: o token reportado pelo usuário não existe em `clientes.token_convite`.

## Mudanças (escopo estrito)

### 1. `src/components/clientes/EnviarConviteClienteDialog.tsx` — corrigir race
- Remover `onClose` das dependências do `useEffect`.
- Disparar a geração **uma única vez por `ctx.clienteId`** (depender só de `ctx?.clienteId` e `ctx?.mode`).
- Guardar o `clienteId` processado em um `useRef` para garantir idempotência mesmo se o ctx mudar de identidade sem mudar o id.
- Manter o flag `cancelled` para evitar `setLink` após desmontagem.
- Após `update`, fazer `.select('token_convite').single()` e usar **o token retornado pelo banco** para montar o link (fonte da verdade — elimina qualquer chance de divergência).
- Se o `update` afetar 0 linhas (RLS), exibir toast claro de erro e fechar.

### 2. `src/pages/cliente/ConviteCliente.tsx` — landing informativa
Hoje a tela de inválido só tem título + uma linha. Vou:
- Substituir a RPC genérica por uma nova RPC `validar_token_convite_cliente(_token uuid)` que retorna:
  - `status` ∈ `'valido' | 'expirado' | 'concluido' | 'inexistente'`
  - dados do cliente (nome, email, escritorio_id, nome do escritório) quando aplicável
- Renderizar mensagens específicas:
  - **expirado** → "Este convite expirou. Peça ao seu contador para gerar um novo link." + botão "Falar com suporte" (WhatsApp Gelson).
  - **concluido** → "Você já criou sua conta. Acesse pelo login do portal." + botão "Ir para login do contribuinte" (`/cliente/login`).
  - **inexistente** → "Link inválido. Verifique se copiou corretamente, ou peça ao seu contador para gerar um novo." + botão suporte.
- Manter o layout split-screen existente; só preencher o lado direito com mais contexto (ícone de estado, descrição, CTA, link de suporte). O lado esquerdo (branding) já está OK conforme screenshot.

### 3. Migration — nova RPC
Criar `public.validar_token_convite_cliente(_token uuid) RETURNS TABLE(status text, cliente_id uuid, nome text, email text, escritorio_id uuid, escritorio_nome text)` com `SECURITY DEFINER`, `STABLE`, `search_path = public, pg_temp`.

Lógica:
- Busca em `clientes` por `token_convite = _token`.
- Se 0 linhas → `status='inexistente'`.
- Se `status_onboarding = 'concluido'` → `status='concluido'`.
- Se `token_convite_expira_em IS NULL OR <= now()` → `status='expirado'`.
- Senão → `status='valido'` com dados + nome do escritório (JOIN em `escritorios`).

Mantém a RPC antiga `buscar_cliente_por_token` intacta (usada em outros lugares possivelmente).

## Fora do escopo

- `GerarLinkConvite.tsx` (gera link com path diferente `/cadastro-cliente/...` em outra tabela `convites_cliente` — não é o caso desta tela).
- `register-from-direct-invite` edge function — continua igual.
- Fluxo de criação de conta (form de senha) já funciona quando o token é válido.
- Mudanças visuais no lado branding do split-screen.

## Verificação

1. Após o build: abrir `/clientes`, clicar em "Enviar convite" em um cliente sem conta, copiar o link, abrir em aba anônima → deve mostrar form de criação de senha.
2. Forçar `status_onboarding='concluido'` num cliente de teste e abrir o link antigo → deve mostrar mensagem "Você já criou sua conta" com botão de login.
3. Forçar `token_convite_expira_em` no passado → deve mostrar "expirou" com CTA de suporte.
4. Abrir URL com UUID aleatório → deve mostrar "Link inválido".
