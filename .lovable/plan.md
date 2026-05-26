## Plano para corrigir documentos/checklist em todos os clientes

### Problema confirmado
- O card do portal do cliente está contando todos os registros de `checklist_documentos`, inclusive itens pendentes sem arquivo.
- A aba Documentos no lado contador em `/clientes/...` ainda mostra uma checklist de documentos pessoais, mesmo quando não há arquivos anexados.
- No banco, existem registros antigos sem arquivo espalhados por clientes/contadores: encontrei 196 itens de checklist sem arquivo, incluindo o cliente Gelson Santos com 5 itens e 0 arquivos reais.

### O que vou ajustar
1. **Portal do cliente: dashboard**
   - Trocar a contagem do card “Envio de Documentos” para contar somente arquivos reais: `status = recebido` e `arquivo_url` preenchido.
   - O status “Pronto para Enviar” só aparecerá quando houver arquivo anexado de verdade.
   - O stepper de documentos também deixará de avançar por checklist pendente sem arquivo.

2. **Portal do cliente: documentos**
   - Manter apenas o fluxo livre de upload e a lista “Arquivos Anexados”.
   - Garantir que a lista use somente arquivos reais, ignorando qualquer item antigo sem `arquivo_url`.

3. **Lado contador: `/clientes/:id` > Documentos**
   - Remover a UI de checklist por categorias e itens pendentes.
   - Substituir por uma visão simples de arquivos reais anexados para a declaração ativa.
   - Quando não houver arquivo real, mostrar vazio corretamente, sem “Documentos Pessoais” nem botão de upload por item.
   - Remover ações que recriam checklist manual nessa tela.

4. **Dados existentes no banco**
   - Criar uma migração para apagar, em todos os escritórios/clientes/contadores, os itens antigos de `checklist_documentos` que não têm arquivo real (`arquivo_url` vazio/nulo ou status pendente).
   - Não apagar arquivos anexados, documentos enviados pelo cliente, documentos do contador, recibos, declarações, DARFs, MEI ou análises.
   - Ajustar status de declarações que ficaram como “documentação recebida/enviado” sem nenhum arquivo real, voltando para pendente/aguardando documentos.

5. **Prevenir retorno do erro**
   - Remover/neutralizar os pontos de criação manual de checklist no fluxo de cliente/contador.
   - Deixar `checklist_documentos` sendo usado apenas como índice de arquivos anexados, não como checklist pendente.

### Validação
- Conferir via consulta que não restem itens pendentes/sem arquivo em `checklist_documentos`.
- Conferir o caso do Gelson Santos: o card deve mostrar 0 documentos e status pendente enquanto não houver upload real.
- Conferir `/clientes/...` no contador: não deve aparecer lista de checklist quando não houver arquivos.