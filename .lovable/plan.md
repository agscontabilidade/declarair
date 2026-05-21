# Bug: DARF não aparece no modal "Enviar Declaração"

## Diagnóstico

O modal `EnviarDeclaracaoEmailModal` aceita apenas props para Declaração e Recibo — **não existe prop nem render para o DARF**, apesar de o campo `arquivo_darf_url` existir em `declaracoes` e ser exibido normalmente na listagem (`/declaracoes`) e no detalhe.

Arquivos envolvidos:
- `src/components/declaracoes/EnviarDeclaracaoEmailModal.tsx` — só tem `arquivoDeclaracaoUrl/Nome` e `arquivoReciboUrl/Nome`. Falta DARF na interface `Props`, na lista visual "Documentos inclusos" e no array `attachmentPaths` passado para a edge function `send-transactional-email`.
- `src/pages/Declaracoes.tsx` (linhas 499-515) — chama o modal sem passar DARF (mas já carrega `arquivo_darf_url/nome` na query, linha 132).
- `src/pages/DeclaracaoDetalhe.tsx` (linhas 215-231) — idem; `decl?.arquivo_darf_url` já vem do hook `useDeclaracao`.

Ou seja, os dados já estão disponíveis nos dois call-sites; só não estão sendo encaminhados ao modal.

## Correção (escopo cirúrgico)

1. **`EnviarDeclaracaoEmailModal.tsx`**
   - Adicionar em `Props`: `arquivoDarfUrl?: string | null` e `arquivoDarfNome?: string | null`.
   - Renderizar o card do DARF na seção "Documentos inclusos" (mesmo padrão visual dos outros, ícone `Receipt` ou `FileText`).
   - Incluir no array `attachmentPaths` quando `arquivoDarfUrl` estiver presente, com filename default `DARF_IRPF_${anoBase}.pdf`.
   - Ajustar a frase padrão da mensagem para mencionar DARF **apenas quando existir** (manter compatibilidade com declarações sem DARF — restituição/isento). Usar concatenação condicional, sem alterar o texto atual quando não houver DARF.

2. **`src/pages/Declaracoes.tsx`** — passar `arquivoDarfUrl={emailTarget.arquivo_darf_url}` e `arquivoDarfNome={emailTarget.arquivo_darf_nome}` ao modal. Confirmar que `emailTarget` carrega esses campos (a query principal já seleciona; verificar onde `emailTarget` é montado).

3. **`src/pages/DeclaracaoDetalhe.tsx`** — passar `arquivoDarfUrl={decl?.arquivo_darf_url}` e `arquivoDarfNome={decl?.arquivo_darf_nome}`.

## Garantias de não regressão

- Props novas são **opcionais** → nenhum outro chamador quebra.
- Render e anexo são condicionais (`if (arquivoDarfUrl)`) → declarações sem DARF (restituição/isento) seguem idênticas.
- Nenhuma mudança em banco, RLS, edge functions ou fluxo de envio — a edge `send-transactional-email` já aceita N anexos via `attachmentPaths`.
- Sem mexer em estilo global, hooks ou queries existentes.

## Validação

- Abrir uma declaração com DARF anexado em `/declaracoes/:id` → clicar "Enviar" → conferir que o card do DARF aparece e que após envio o e-mail chega com 3 anexos.
- Repetir em uma declaração **sem** DARF (restituição) → conferir que apenas Declaração + Recibo aparecem (comportamento atual preservado).
- Repetir o fluxo a partir da listagem `/declaracoes` (botão de envio na linha).
