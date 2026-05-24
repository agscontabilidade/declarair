# Extrair resultado do Recibo, não da Declaração

## Problema
Hoje a edge function `processar-pdf-declaracao` tenta extrair `tipo_resultado` (restituição/pagamento/nenhum) e `valor_resultado` do **PDF da declaração completa** (10–30+ páginas). A IA confunde o valor final com totais de rendimentos/base de cálculo/imposto devido, gerando resultados errados.

O **recibo da Receita** tem 1–2 páginas, layout fixo, e contém exatamente os campos que precisamos: número do recibo, data de transmissão, e o valor de imposto a restituir OU a pagar.

## Solução
Inverter os papéis dos dois tipos no pipeline:

- **`tipo = "recibo"`** passa a ser a **única** fonte de `tipo_resultado` + `valor_resultado` (além de `numero_recibo` e `data_transmissao` que já extrai hoje).
- **`tipo = "declaracao"`** deixa de chamar IA para extrair resultado. O PDF da declaração completa passa a ser apenas **arquivado** como documento de referência (validação de CPF/ano continua, mas nada de valor).

## Mudanças

### 1. `supabase/functions/processar-pdf-declaracao/ai-fallback.ts`
- **Recibo (novo schema da IA)**: adicionar `tipo_resultado` (`restituicao` | `pagamento` | `nenhum`) e `valor_resultado` (number) no tool schema do tipo `recibo`. Prompt instrui: procurar "Imposto a Restituir" ou "Imposto a Pagar" / "Saldo a Pagar" no recibo; se ambos zero → `nenhum`.
- **Declaração**: remover `tipo_resultado` e `valor_resultado` do schema e do prompt. Manter apenas validação de CPF + ano. Remover toda a validação anti-alucinação relacionada a esses campos no tipo declaração.

### 2. `supabase/functions/processar-pdf-declaracao/index.ts`
- Bloco `tipo === "recibo"` (linhas ~205, ~362): aceitar e gravar `tipo_resultado` + `valor_resultado` em `updates`, exatamente como hoje faz no bloco `tipo === "declaracao"`.
- Bloco `tipo === "declaracao"` (linhas ~189, ~285, ~345): remover gravação de `tipo_resultado`/`valor_resultado`. Continuar gravando `arquivo_declaracao_url`, validando CPF e ano. Remover do modal de confirmação manual da declaração os campos de resultado (passam pro modal do recibo).
- Bloco de transição de status: o status só vai para `transmitida` quando o **recibo** for validado (já é o comportamento atual via `recibo_validado_em`). Confirmar que nada na declaração move o status sozinho.

### 3. Frontend — modais de confirmação manual
- `ManualConfirmacaoModal` (ou equivalente) usado em upload de **declaração**: remover seleção de tipo_resultado/valor.
- Mesmo modal para **recibo**: adicionar os campos `tipo_resultado` (radio: restituição/pagar/nenhum) e `valor_resultado` (input BRL), além dos já existentes (número do recibo, data).

### 4. Sem mudanças
- Schema do banco (colunas `tipo_resultado`, `valor_resultado`, `numero_recibo`, `data_transmissao` continuam onde estão).
- Templates de mensagem, hooks `useDeclaracao`, `useClientePortal`, `useMensagens` — leem os mesmos campos, só muda a origem da escrita.
- Bucket de storage, RLS, billing.

## Validação
1. Upload de PDF de declaração completa → grava arquivo, valida CPF/ano, **não** preenche resultado, **não** muda status.
2. Upload de recibo → IA extrai número, data, tipo e valor; grava todos, move status para `transmitida`, dispara notificações (WhatsApp/email) com o valor correto.
3. Confirmação manual no recibo → mesmos 4 campos aceitos pelo backend.
4. Verificar logs `[ia]` mostrando extração só do recibo para `tipo_resultado`.

## Riscos
- Declarações já transmitidas no sistema permanecem intactas (mudança só afeta novos uploads).
- Se um escritório só anexar a declaração e nunca o recibo, o resultado ficará vazio até subirem o recibo — **comportamento desejado** segundo a decisão do usuário ("só recibo extrai resultado").
