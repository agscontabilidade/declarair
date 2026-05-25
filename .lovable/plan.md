## Objetivo

Quando o contador cadastra um cliente em `/clientes → Novo Cliente`, oferecer envio imediato de convite de acesso ao portal — sem o contador precisar definir senha (o próprio cliente cria sua senha pelo link).

## Escopo (estrito)

Apenas o fluxo do botão "Novo Cliente". Não mexer no modal de edição, no botão "Gerar Link Convite" da página, nem em RLS/schema.

## Mudanças

### 1. `src/components/clientes/ClienteModal.tsx` (apenas modo `create`)

- Adicionar campo `enviarConvite: boolean` no state do formulário, **marcado por padrão**.
- Renderizar um `Switch` + label **"Enviar convite de acesso após cadastrar"** com texto auxiliar curto: "O cliente recebe um link para criar a própria senha e acessar o portal."
- Validação extra: se `enviarConvite === true`, exigir `email` **ou** `telefone` preenchido (mostrar erro inline). Hoje email/telefone são opcionais — manter opcionais quando o switch estiver desligado.
- Após `onSave` retornar sucesso, expor o flag no callback. Para isso, estender a prop `onSavedAndUpload` → renomear semanticamente para passar também `enviarConvite` no contexto, **ou** adicionar nova prop `onSavedAndInvite?: (ctx: SavedClienteResult) => void`. Vou usar **nova prop separada** para não impactar o fluxo de upload existente.

### 2. `src/pages/Clientes.tsx`

- Reaproveitar o componente/lógica de envio que já existe em `GerarLinkConvite` (ou o `enviarConvite` do `useClientePerfil`). Criar um estado `convidarCliente: { clienteId, nome, email, telefone } | null`.
- Passar `onSavedAndInvite={(ctx) => setConvidarCliente(...)}` ao `ClienteModal`.
- Ao ativar, abrir o **mesmo modal de seleção de canal** já usado em `/clientes/:id` (WhatsApp automático / WhatsApp manual / Email / Copiar link). Isso evita duplicar UI e mantém consistência.
  - Verificar se `GerarLinkConvite` aceita prop `clienteId` para reuso direto. Se não aceitar, extrair a parte de "seleção de canal" em um subcomponente reutilizável `EnviarConviteDialog` e usar nos dois lugares.

### 3. Backend / schema

- **Nenhuma mudança**. O `gerarTokenConvite` existente já popula `clientes.token_convite` + `token_convite_expira_em` (7 dias) e atualiza `status_onboarding = 'convite_enviado'`. O cliente acessa `/cliente/convite/:token`, cria senha, e a edge function `register-from-direct-invite` cria o `auth.users` + vincula `auth_user_id`.

## Por que não criar conta + senha direto no modal

- LGPD/segurança: senha digitada por terceiro é má prática.
- O cliente precisaria saber a senha — exigiria comunicação externa de qualquer forma.
- O fluxo de convite já existe, é testado e cobre os 3 canais (WhatsApp, email, copiar).

## Fora de escopo

- Mudar modal de edição, página de detalhe do cliente, RLS, schema, fluxo de cliente já existente sem `auth_user_id`.
- Tornar email/telefone obrigatórios no cadastro (só obrigatório se o switch de convite estiver ligado).

## Detalhes técnicos

- Estender `SavedClienteResult` para incluir `email?: string | null; telefone?: string | null` para o handler conseguir escolher canal default (auto WhatsApp se telefone, senão email).
- Reuso preferencial: extrair `EnviarConviteDialog` a partir do conteúdo atual de `GerarLinkConvite` se ele estiver acoplado demais ao botão "Gerar Link" da página.
