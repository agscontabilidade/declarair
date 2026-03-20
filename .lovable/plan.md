

# Implementação: Cobranças, Mensagens, Portal Cliente Dashboard e Formulário IR

## Visão Geral

4 telas completas: Cobranças (contador), Mensagens/Templates (contador), Portal do Cliente Dashboard e Formulário IR wizard (cliente). Reescrita dos 4 placeholders existentes sem alterar nenhum outro arquivo.

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useCobrancas.ts` | Queries para cobranças do escritório: lista com filtros, KPIs (total a receber, recebido, atrasado), CRUD, auto-detect atrasados |
| `src/hooks/useMensagens.ts` | Queries para templates e mensagens enviadas, CRUD templates, seed dos 3 padrão, envio com registro |
| `src/hooks/useClientePortal.ts` | Dados do portal do cliente: declaração ativa, checklist pendente, status formulário |
| `src/hooks/useFormularioIR.ts` | CRUD do formulário IR: load/create, autosave debounce 1.5s, finalizar |
| `src/components/cobrancas/CobrancaModal.tsx` | Modal nova/editar cobrança: select cliente, declaração opcional, valor com máscara R$, datepicker |
| `src/components/cobrancas/CobrancasTable.tsx` | Tabela com badges de status, ações (pagar, editar, cancelar, excluir) |
| `src/components/cobrancas/ConfirmModal.tsx` | Modal de confirmação genérico para ações destrutivas |
| `src/components/mensagens/TemplateEditor.tsx` | Editor de template com tags clicáveis e preview em tempo real |
| `src/components/mensagens/TemplateList.tsx` | Lista de templates com toggle ativo/inativo, editar, excluir |
| `src/components/mensagens/TestarMensagemModal.tsx` | Modal de teste: select cliente → preview com dados reais → copiar / abrir WhatsApp |
| `src/components/cliente-portal/StatusStepper.tsx` | Steps visuais 4 etapas baseado no status da declaração |
| `src/components/formulario-ir/WizardStep.tsx` | Wrapper de step com validação |
| `src/components/formulario-ir/StepDadosPessoais.tsx` | Step 1: estado_civil, cônjuge (condicional) |
| `src/components/formulario-ir/StepDependentes.tsx` | Step 2: lista dinâmica, CPF obrigatório |
| `src/components/formulario-ir/StepRendimentos.tsx` | Step 3: emprego CLT, autônomo, aluguéis, outros |
| `src/components/formulario-ir/StepBensDireitos.tsx` | Step 4: imóveis, veículos, aplicações, cripto |
| `src/components/formulario-ir/StepDividasOnus.tsx` | Step 5: financiamentos, empréstimos |
| `src/components/formulario-ir/StepDeducoes.tsx` | Step 6: médicas (sem limite), educação (R$3.561,50), PGBL (12%) |
| `src/components/formulario-ir/StepInfoAdicionais.tsx` | Step 7: textarea + checkbox confirmação |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Cobrancas.tsx` | Reescrever com KPIs, tabela filtrada, modals |
| `src/pages/Mensagens.tsx` | Reescrever com templates CRUD, preview, teste |
| `src/pages/cliente/ClienteDashboard.tsx` | Reescrever com dados reais: declaração ativa, stepper, checklist, form status |
| `src/pages/cliente/ClienteFormulario.tsx` | Reescrever com wizard 7 steps + autosave |

---

## Detalhes Técnicos

### Cobranças

**Auto-detect atrasados**: No `useCobrancas`, ao carregar, executar `supabase.from('cobrancas').update({ status: 'atrasado' }).lt('data_vencimento', today).eq('status', 'pendente').eq('escritorio_id', escritorioId)` antes de buscar dados.

**KPIs**: 3 cards calculados client-side a partir da lista de cobranças:
- Total a Receber: SUM(valor) WHERE status IN ('pendente','atrasado')
- Recebido no Ano: SUM(valor) WHERE status='pago' AND ano(data_pagamento)=anoAtual
- Atrasado: SUM(valor) WHERE status='atrasado'

**Filtros**: Select de status (todos/pendente/pago/atrasado/cancelado) + date range picker para período de vencimento.

**Ações**: Marcar pago (UPDATE status+data_pagamento), Editar (modal), Cancelar (ConfirmModal → UPDATE status='cancelado'), Excluir (só se cancelado, ConfirmModal → DELETE).

**Modal Nova Cobrança**: Select de clientes do escritório, select opcional de declaração do cliente selecionado, campo valor com formatação BRL, datepicker para vencimento.

### Mensagens

**Seed automático**: No hook, verificar `templates_mensagem` count para o escritório. Se 0, INSERT dos 3 templates padrão.

**Tags**: Array de tags disponíveis renderizadas como chips clicáveis. Ao clicar, inserir no cursor do textarea do corpo.

**Preview**: Substituir tags por dados fictícios em tempo real: `{nome_cliente}` → "João Silva", `{ano_base}` → "2025", etc.

**Testar**: Modal com select de cliente real → buscar declaração mais recente → substituir tags por dados reais → botão "Copiar" (clipboard) + "Abrir WhatsApp" (`https://wa.me/55{telefone}?text={encodedMsg}`).

**Envio**: INSERT em `mensagens_enviadas` com conteudo_final substituído, canal, cliente_id, escritorio_id.

### Portal do Cliente Dashboard

**Dados**: Usar `profile.clienteId` do AuthContext. Buscar declaração mais recente (`ORDER BY created_at DESC LIMIT 1`), checklist pendente, formulário IR.

**Stepper**: 4 steps visuais (aguardando_documentos=1, documentacao_recebida=2, declaracao_pronta=3, transmitida=4). Step atual highlighted, anteriores com check verde.

**Cards**: Documentos pendentes (count), Status formulário IR, Resultado (se transmitida).

**Empty state**: Se sem declaração, card centralizado "Seu contador ainda não criou sua declaração".

### Formulário IR Wizard

**Estrutura**: Estado global do formulário em `useFormularioIR`. Load existente via `formulario_ir` WHERE `cliente_id`. Se não existe, criar registro com `status_preenchimento='em_andamento'` ao entrar.

**Progress**: Barra no topo "Etapa X de 7" + percentual. Botões Anterior/Próximo. Step 7 tem "Finalizar".

**Autosave**: Debounce 1.5s em qualquer mudança de campo. UPDATE `formulario_ir` com campos do step atual. Header mostra "Rascunho salvo às HH:MM".

**Steps**:
1. Dados Pessoais: `estado_civil` (select: solteiro/casado/divorciado/viúvo/união_estável), `conjuge_nome`+`conjuge_cpf` (visíveis se casado/união_estável)
2. Dependentes: Array em `dependentes` JSONB. Cada item: nome*, cpf* (máscara+validação), data_nascimento, parentesco (select), tipo. Botão adicionar/remover.
3. Rendimentos: `rendimentos_emprego` (array: cnpj, razao_social, rendimento, irrf), `rendimentos_autonomo` (mensal), `rendimentos_aluguel` (array), `outros_rendimentos`
4. Bens: `bens_direitos` array: tipo (select), descrição, valor_anterior, valor_atual
5. Dívidas: `dividas_onus` array: tipo, credor, saldo
6. Deduções: `despesas_medicas` (array, informar "sem limite"), `despesas_educacao` (array, informar limite R$3.561,50), `previdencia_privada` (valor, informar limite 12%)
7. Info Adicionais: `informacoes_adicionais` textarea + checkbox "Confirmo que as informações são verdadeiras"

**Finalizar**: UPDATE `formulario_ir.status_preenchimento='concluido'` + UPDATE `clientes.status_onboarding='concluido'`. Tela de sucesso com ícone animado (check verde com scale-in).

**Validação por step**: Step 2 requer CPF válido para cada dependente. Step 7 requer checkbox marcado. Outros steps sem campos obrigatórios (permitem pular).

