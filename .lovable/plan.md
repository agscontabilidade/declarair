## Objetivo
Eliminar qualquer regra que trate documentos como checklist obrigatório/pendente. Documentos devem ser arquivos livres, enviados pelo cliente ou pelo contador, sem gerar “Pendente de Reenvio” por itens antigos de checklist.

## Plano de implementação
1. **Parar criação automática de checklist padrão**
   - Remover a criação dos itens obrigatórios em:
     - cadastro por convite direto do cliente;
     - cadastro por convite antigo;
     - criação de declaração pelo Dashboard;
     - criação de declaração dentro do perfil do cliente.
   - A declaração continua sendo criada normalmente, mas sem itens pré-obrigatórios.

2. **Corrigir status do portal do cliente**
   - Ajustar `useClientePortal` para não calcular pendência por `checklist_documentos.obrigatorio`.
   - O status “Pendente de Reenvio” deixará de depender de checklist pendente.
   - Se houver `status_documentos = 'enviado'` ou documentos anexados, o card ficará como enviado/pronto, nunca como pendente por checklist antigo.

3. **Ajustar Dashboard do cliente**
   - Reordenar a regra do badge de documentos para priorizar “Enviado ao Contador”.
   - Remover a condição visual que mostra “Pendente de Reenvio” baseada em `statusStep === 2`.

4. **Manter upload livre para cliente e contador**
   - Preservar os uploads já existentes, que salvam arquivos como registros não obrigatórios.
   - Garantir que o contador continue podendo anexar documentos livremente pelo modal de documentos.
   - Evitar qualquer fluxo que peça associação do arquivo a item pendente.

5. **Neutralizar legado sem apagar documentos**
   - Adicionar uma migração para marcar itens antigos de `checklist_documentos` como não obrigatórios quando não tiverem arquivo anexado, evitando que dados antigos causem pendência.
   - Remover/desativar lógica de banco que reverte declaração para “aguardando_documentos” quando arquivos são removidos, para não voltar a aparecer como pendente por ausência de checklist.
   - Não apagar arquivos já enviados.

6. **Verificação do fluxo**
   - Conferir no código que não existe mais criação de checklist obrigatório.
   - Verificar que upload do cliente muda status para `documentacao_recebida`/`enviado`.
   - Verificar que upload/visualização do contador permanece funcional.
   - Rodar uma checagem direcionada nas referências a `obrigatorio`, `Pendente de Reenvio` e `checklistPadrao` para garantir que o fluxo crítico foi removido.