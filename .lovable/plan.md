## Objetivo

1. Melhorar a UI/UX do modal "Novo Cliente" mantendo o design system (Syne/DM Sans, tokens semânticos, navy primário, radius 10px).
2. Após salvar o cliente, oferecer ao contador uma ação extra "Enviar documentos agora" que abre o modal de documentos já existente, criando o fluxo no Drive em nome do cliente, atualizando status e refletindo em tempo real.

## Escopo (estrito)

Mexer apenas em:
- `src/components/clientes/ClienteModal.tsx` (UI + retorno de id)
- `src/hooks/useClientes.ts` (retornar id da declaração criada)
- `src/pages/Clientes.tsx` (orquestrar abertura do `DocumentosDeclaracaoModal` pós-criação)

Não alterar lógica de RLS, schema, permissões, ou o componente `DocumentosDeclaracaoModal` (já faz upload no bucket `documentos-clientes`, cria registro em `checklist_documentos` categoria `contador` e invalida queries do Drive — exatamente o "fluxo Drive em nome do cliente" pedido).

## Parte 1 — Refino visual do modal "Novo Cliente"

Manter todos os campos atuais (Nome, CPF, Email, WhatsApp, Data Nascimento, Contador Responsável, Procuração e-CAC + validade). Apenas reorganizar e polir:

- Largura: `sm:max-w-lg` (um pouco mais respirável que `sm:max-w-md`).
- Header com ícone circular (UserPlus) + título em `font-display` + descrição curta ("Cadastre um novo contribuinte. Você poderá enviar documentos logo em seguida.").
- Agrupar campos em duas seções com `<section>` discreto e label de seção em `text-xs uppercase tracking-wide text-muted-foreground`:
  1. "Dados pessoais": Nome, CPF, Data de Nascimento (grid 2 colunas em md para CPF + nascimento).
  2. "Contato": Email + WhatsApp (grid 2 colunas em md).
  3. "Atribuição": Contador Responsável.
  4. Card existente da Procuração e-CAC mantido, com leve ajuste de spacing.
- Inputs com ícones leading (`User`, `IdCard`, `Mail`, `Phone`, `Calendar`) usando wrapper com `pl-9` e ícone `absolute left-3 text-muted-foreground` — sem custom colors, só tokens.
- Validação inline: mensagens de erro com `text-xs text-destructive` (já existe pra CPF, manter padrão).
- Footer reformulado com 3 ações:
  - `Cancelar` (ghost)
  - `Salvar` (default) — comportamento atual
  - `Salvar e enviar documentos` (variant default com ícone `Upload`) — salva e em seguida abre o `DocumentosDeclaracaoModal`
- Loading state: spinner `Loader2` dentro do botão acionado.

## Parte 2 — Fluxo "Salvar e enviar documentos"

### Hook `useClientes.ts`
- `createCliente.mutationFn` hoje retorna `void`. Alterar para retornar `{ clienteId, declaracaoId }`. Já cria a declaração do `ano_base` atual; basta propagar o id.

### `ClienteModal.tsx`
- Adicionar prop opcional `onSavedAndUpload?: (ctx: { clienteId: string; declaracaoId: string; nome: string }) => void`.
- Internamente, dois handlers: `handleSubmit(close=true)` (atual) e `handleSubmitAndUpload()` que chama `onSave` recebendo o resultado tipado, depois chama `onSavedAndUpload` antes de fechar.
- Para isso, ajustar o tipo de `onSave` para `Promise<{ clienteId: string; declaracaoId: string } | void>` (modo edit continua retornando void).

### `Clientes.tsx`
- Novo state `pendingUploadDecl: { declaracaoId: string; nome: string } | null`.
- Passar `onSavedAndUpload` para o `ClienteModal` de criação. No callback, fechar o modal de criação e setar `pendingUploadDecl`.
- Renderizar `<DocumentosDeclaracaoModal>` controlado por esse state. O componente já:
  - Faz upload no path `{escritorio_id}/{cliente_id}/contador-...` (Drive do cliente).
  - Insere `checklist_documentos` com `status='recebido'`, categoria `contador`.
  - Invalida `documentos-declaracao`, `drive-docs`, `declaracao-aba-docs`, `declaracao-checklist` — garante atualização "em tempo real" via React Query (consistente com o restante do app; Realtime postgres_changes da tabela já cobre outros clientes vendo a mudança, conforme memória).

### Status
Nenhuma mudança extra de status é necessária — ao inserir o primeiro documento `recebido` para a declaração `aguardando_documentos`, os triggers/automações de kanban existentes seguem o fluxo padrão. Não tocar nesse comportamento.

## Detalhes técnicos

- Sem `any`. Tipar retorno do mutation com interface local `CreateClienteResult`.
- Usar somente tokens (`bg-primary`, `text-muted-foreground`, `border-input`, `text-destructive`) — nada de cores hardcoded.
- Manter `usePersistedForm` e `clearForm()` após sucesso em ambos os fluxos.
- Toasts existentes mantidos. Adicionar toast "Cliente criado. Envie os documentos para o Drive." quando usar o botão de upload.
- Acessibilidade: cada `section` com `aria-labelledby` apontando para o título; ícones decorativos com `aria-hidden`.

## Diagrama do fluxo

```text
[Clientes] -> Novo Cliente
  ClienteModal
    [Cancelar]  [Salvar]  [Salvar e enviar documentos]
                   |              |
                   v              v
              fecha          createCliente -> {clienteId, declaracaoId}
                                  |
                                  v
                          DocumentosDeclaracaoModal(declaracaoId)
                          (upload -> Drive + checklist + invalidate)
```

## Fora de escopo

- Não mudar schema, RLS, triggers, kanban, ou o `DocumentosDeclaracaoModal`.
- Não alterar fluxo de convite/portal do cliente.
- Não refatorar `ClienteViewModal` nem `ClientesTable`.
