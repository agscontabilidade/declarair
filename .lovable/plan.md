# Cobrança automática após cadastro de cliente

## Objetivo
Quando o contador terminar de cadastrar um novo cliente em `/clientes`, exibir um diálogo perguntando se já deseja cadastrar a cobrança do Imposto de Renda. Se confirmar, abre o `CobrancaModal` já travado no cliente recém-criado (e na declaração do ano corrente, quando existir). Se recusar, fluxo termina normalmente.

## Escopo
- Apenas no fluxo de **criação** (`mode="create"`) do `ClienteModal` em `src/pages/Clientes.tsx`.
- Vale para os três botões finais do modal: **Salvar**, **Salvar e enviar documentos** e quando o usuário marcar **Enviar convite**. Em todos os casos, depois do sucesso, perguntar sobre a cobrança.
- Não altera edição, exclusão, nem o portal do cliente.

## Fluxo proposto
1. Contador clica em "Novo Cliente" → preenche → salva.
2. `createCliente.mutateAsync` retorna `{ clienteId, declaracaoId }` (já existe).
3. `Clientes.tsx` guarda esse contexto e abre um `AlertDialog` "Gerar cobrança do IR agora?" com:
   - Título: **Cadastrar cobrança do Imposto de Renda?**
   - Descrição: "O cliente *Nome* foi cadastrado. Deseja já registrar a cobrança da declaração?"
   - Botões: **Agora não** / **Sim, cadastrar cobrança**.
4. Se "Sim": abre o `CobrancaModal` existente passando:
   - `clienteIdLocked = clienteId`
   - `clienteNomeLocked = nome`
   - pré-preenche `declaracaoId` com a recém criada (ano corrente) quando houver — fazemos isso passando um novo prop opcional `declaracaoIdInicial` ao `CobrancaModal`.
5. Se "Agora não": fecha e segue. Os fluxos paralelos (upload de documentos, envio de convite) continuam funcionando como hoje — o prompt de cobrança aparece **depois** do modal de cliente fechar, sem bloquear esses outros diálogos (eles podem coexistir em ordem: cobrança primeiro, depois upload/convite, ou abrimos a cobrança somente quando o usuário fechar o upload, para evitar dois modais sobrepostos — ver "Decisão UX" abaixo).

## Decisão UX — coexistência com upload/convite
Hoje, "Salvar e enviar documentos" já abre `DocumentosDeclaracaoModal` e "Enviar convite" abre `EnviarConviteClienteDialog`. Para evitar empilhar diálogos:
- O `AlertDialog` de cobrança só é mostrado **após** o fechamento do `DocumentosDeclaracaoModal`/`EnviarConviteClienteDialog`. Implementação: armazenar `pendingCobrancaCtx` no `Clientes.tsx` e disparar o `AlertDialog` no `onOpenChange(false)` do diálogo subsequente. Quando o usuário só clicou "Salvar" (sem upload/convite), o prompt aparece imediatamente.

## Mudanças técnicas
### `src/pages/Clientes.tsx`
- Novo estado: `pendingCobrancaCtx: { clienteId, nome, declaracaoId } | null` e `askCobrancaOpen: boolean`.
- No `onSave` do `ClienteModal` (create): aguardar o `mutateAsync`, capturar o retorno, salvar em `pendingCobrancaCtx`.
- Disparar `setAskCobrancaOpen(true)` quando não houver upload/convite pendentes; caso contrário, disparar no `onOpenChange(false)` desses modais.
- Adicionar `<AlertDialog>` (shadcn) com as ações. Confirmar → abrir o `CobrancaModal` existente (`setCobrancaCliente({...})`) passando também `declaracaoId`.

### `src/components/cobrancas/CobrancaModal.tsx`
- Adicionar prop opcional `declaracaoIdInicial?: string | null`.
- No `useEffect` de inicialização (quando não é edição), se houver `declaracaoIdInicial`, pré-selecionar.

### `src/components/clientes/ClienteModal.tsx`
- Sem mudanças funcionais. Apenas garantir que `onSave` retorne o resultado da mutation para o pai (já retorna via `Promise`).

## Fora de escopo
- Não muda RLS, schema, hooks ou regras de negócio de cobrança.
- Não cria cobrança automaticamente — sempre passa pelo `CobrancaModal` para o contador definir descrição, valor e vencimento.
- Não altera fluxo de auto-cadastro do cliente (portal externo).

## Critérios de aceite
- Após salvar um novo cliente, o sistema pergunta sobre criar cobrança.
- Ao confirmar, abre `CobrancaModal` com cliente travado e (se existir) declaração do ano pré-selecionada.
- Recusar fecha o prompt sem efeitos colaterais.
- Combinações com "Salvar e enviar documentos" e "Enviar convite" funcionam sem sobreposição visual.
- Fluxo de edição de cliente não exibe o prompt.
