## Objetivo

Restaurar o botão "Gerar Link de Convite" na página de Clientes, gerando um link estável que não expira e pode ser reutilizado.

## Observação sobre "sem token"

O link precisa obrigatoriamente carregar um identificador na URL para que o sistema saiba para qual escritório direcionar o cadastro (ex.: `/cadastro-cliente/abc123...`). Vou manter esse identificador opaco (gerado uma vez e reutilizável), mas **sem qualquer expiração** e **sem marcar como "usado"** — funciona como um link público permanente do escritório. Se preferir uma URL ainda mais curta/limpa (ex.: `/c/<slug-do-escritorio>`), me avise que ajusto.

## Mudanças

### 1. `src/pages/Clientes.tsx`
- Importar `GerarLinkConvite` e renderizar o botão ao lado de "Novo Cliente" (visível só para quem tem `podeCriarClientes`, igual ao botão atual).

### 2. `src/components/clientes/GerarLinkConvite.tsx`
- Remover o aviso "O link expira em 30 dias" no painel de sucesso.
- Manter os demais textos (reutilizável, copiar, WhatsApp, e-mail).

### 3. Edge function `supabase/functions/validate-invite-token/index.ts`
- Remover o filtro `.gt('expira_em', ...)` ao buscar o convite. Token válido = token existe.

### 4. Edge function `supabase/functions/register-from-invite/index.ts`
- Remover o filtro `.gt('expira_em', ...)`.
- Não marcar o convite como `usado=true` após o cadastro (mantém reutilizável para outros contribuintes).

### 5. Migração SQL (`convites_cliente`)
- `ALTER COLUMN expira_em DROP NOT NULL` (se aplicável) e `DROP DEFAULT`.
- `UPDATE convites_cliente SET expira_em = NULL, usado = false, usado_em = NULL, usado_por_cliente_id = NULL` para destravar os links antigos que já tinham expirado ou foram marcados como usados.

## Fora de escopo
- Não mexer no fluxo de convite direto (criar cliente + enviar e-mail/WhatsApp imediato) que continua funcionando como está.
- Não alterar RLS nem outras tabelas.
- Sem mudanças no portal do cliente (`CadastroCliente.tsx`) — ele já consome o token via edge function.