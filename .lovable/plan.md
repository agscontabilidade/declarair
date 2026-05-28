# Corrigir prompt de cobrança após "Salvar"

## Problema
No `ClienteModal`, o botão verde "Salvar" (handleSubmit) dispara `onSavedCreate`, mas em `src/pages/Clientes.tsx` o `AlertDialog` de cobrança só abre dentro dos `onClose` do `EnviarConviteClienteDialog` e do `DocumentosDeclaracaoModal`. Como o "Salvar" puro não abre nenhum desses dois modais, o prompt nunca é exibido.

## Correção (escopo mínimo, só presentation)

### `src/components/clientes/ClienteModal.tsx`
- Diferenciar o caminho do salvamento. Adicionar um flag `intent` nos callbacks ou separar:
  - `handleSubmit` (Salvar puro) → chama `onSavedCreate(ctx)` apenas.
  - `handleSubmitAndUpload` → chama `onSavedAndUpload(ctx)` apenas (remover `onSavedCreate` daqui).
  - Caminho de "Salvar e enviar convite" (se existir) → chama `onSavedAndInvite(ctx)` apenas.
- Assim, `onSavedCreate` passa a sinalizar exclusivamente "Salvar puro".

### `src/pages/Clientes.tsx`
- No handler `onSavedCreate` da instância de criação, além de setar `pendingCobranca`, abrir o `AlertDialog` imediatamente:
  ```ts
  onSavedCreate={(ctx) => {
    setPendingCobranca({ clienteId: ctx.clienteId, nome: ctx.nome, declaracaoId: ctx.declaracaoId });
    setAskCobrancaOpen(true);
  }}
  ```
- Manter a lógica atual nos `onClose` do `EnviarConviteClienteDialog` e `DocumentosDeclaracaoModal`: ao fechar, se houver `pendingCobranca`, abrir `askCobrancaOpen` (esses caminhos continuam funcionando pois `pendingCobranca` é setado por `onSavedAndUpload`/`onSavedAndInvite`).
- Para isso, ajustar `onSavedAndUpload` e `onSavedAndInvite` em `Clientes.tsx` para também setarem `pendingCobranca` (já que o `ClienteModal` não mais o fará nesses caminhos).

## Critérios de aceite
- Clicar "Salvar" no `ClienteModal` (modo create) → modal fecha → `AlertDialog` "Cadastrar cobrança do Imposto de Renda?" aparece imediatamente.
- Clicar "Salvar e enviar documentos" → fluxo de upload abre; ao fechá-lo, o prompt de cobrança aparece.
- Clicar "Salvar e enviar convite" → diálogo de convite abre; ao fechá-lo, o prompt de cobrança aparece.
- Em `mode="edit"`, nenhum prompt aparece.
- Confirmar no prompt abre `CobrancaModal` com cliente travado e declaração pré-selecionada. "Agora não" fecha sem efeitos.

## Fora de escopo
Sem mudanças em RLS, schema, hooks ou regras de negócio.
