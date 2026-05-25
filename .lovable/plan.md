## Problema

Em `src/pages/cliente/ClienteDocumentos.tsx`, ao subir o primeiro arquivo o código marca `status_documentos = 'enviado'` (linha 246). A renderização da zona de upload está condicionada a `!docsEnviadosAoContador` (linha 536), então a área de "Arraste e solte / Selecionar Arquivos" some assim que o primeiro documento é salvo, impedindo o cliente de anexar mais.

Isso conflita com o próprio texto dos tooltips ("Novos uploads continuam sendo aceitos") e com a expectativa do produto.

## Mudança

Arquivo: `src/pages/cliente/ClienteDocumentos.tsx`

1. **Remover o gate `!docsEnviadosAoContador` da Upload Zone** (linha 536). A zona de upload deve ficar sempre visível enquanto o cliente estiver na página, independentemente de já ter enviado.

2. **Manter o badge "Enviado ao Contador"** e o botão "Enviar ao Contador" como estão (já tratam o estado corretamente — botão some quando já enviado, badge aparece).

3. **Sem mudanças** em:
   - Lógica de `handleFiles` (já notifica o contador a cada novo upload).
   - Banco de dados / RLS / status (já funciona — `status_documentos='enviado'` continua sendo setado em cada upload, e a remoção de todos os arquivos volta para `aguardando_documentos`).
   - Componente de Observações, modal de relação, lista de anexos.

## Fora do escopo

- Alterar status da declaração ao reabrir uploads.
- Mudar visual da zona de upload.
- Mexer no lado contador.