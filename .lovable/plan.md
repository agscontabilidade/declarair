## Contexto

Hoje o lembrete de prazo IR enviado via WhatsApp tem o texto **hardcoded** em `supabase/functions/enviar-lembretes-prazo/index.ts` (`renderMensagemWhatsApp`). O contador só consegue alterar:
- a **data do prazo** (campo "Prazo final" no modal — pode digitar 29/05/2026)
- uma **"Mensagem adicional"** que entra no meio

Mas o cabeçalho/rodapé fixo (`"Lembrete: ainda não recebemos seus documentos…"`, `"📅 Prazo final: …"`, `"— {escritorio}"`) não pode ser editado.

Sobre o **prazo 30/05 → 29/05**: o campo já é editável no modal. Vou apenas ajustar a **data padrão sugerida** para `2026-05-29`.

## Escopo (estrito)

Apenas WhatsApp do lembrete de prazo IR. Não mexo em emails, em outros templates, em automações nem em RLS.

## Mudanças

### 1. Banco — 1 coluna em `escritorios`
```sql
ALTER TABLE public.escritorios
  ADD COLUMN IF NOT EXISTS lembrete_whatsapp_template text;
```
Valor `NULL` = usa o texto padrão atual (zero quebra para escritórios existentes).

### 2. Edge function `enviar-lembretes-prazo`
- Buscar `escritorios.lembrete_whatsapp_template` junto com `nome/nome_fantasia`.
- Se preenchido: substituir placeholders `{nome}`, `{ano_base}`, `{prazo}`, `{escritorio}`, `{mensagem_adicional}` e usar como mensagem inteira.
- Se `NULL`/vazio: manter `renderMensagemWhatsApp` atual exatamente como está.

### 3. UI — nova sub-aba "Lembretes" em `MensagensTab`
Adicionar 4ª aba (`<TabsTrigger value="lembretes">`) com:
- `Textarea` (rows=10) ligado a `lembrete_whatsapp_template`
- Lista clicável dos placeholders disponíveis (`{nome}`, `{ano_base}`, `{prazo}`, `{escritorio}`, `{mensagem_adicional}`) — clicar insere no cursor
- Bloco de **pré-visualização** ao vivo com dados de exemplo
- Botão **"Restaurar padrão"** (seta o campo para o template default, mostrando o texto atual hardcoded)
- Botão **Salvar** → `update escritorios set lembrete_whatsapp_template = ... where id = escritorio_id` (já protegido por RLS de dono)

Hook novo: `src/hooks/useLembreteTemplate.ts` (query + mutation simples).

### 4. Default da data no modal
Em `src/components/lembretes/LembreteEnvioModal.tsx`, mudar:
```ts
setPrazoFinal(`${ano}-05-30`);  // antes
setPrazoFinal(`${ano}-05-29`);  // depois
```

## Arquivos tocados

- `supabase/migrations/<nova>.sql` (coluna)
- `supabase/functions/enviar-lembretes-prazo/index.ts` (ler + aplicar template)
- `src/hooks/useLembreteTemplate.ts` (novo)
- `src/components/configuracoes/MensagensTab.tsx` (4ª aba)
- `src/components/configuracoes/LembretesTemplateTab.tsx` (novo — componente da aba)
- `src/components/lembretes/LembreteEnvioModal.tsx` (data padrão)

## Não-objetivos

- Não toco no template de **email** (`lembrete-prazo-ir` no react-email) — o contador continua com a "Mensagem adicional" para personalizar email
- Não adiciono variáveis novas além das 5 listadas
- Não mexo em `templates_mensagem` (sistema genérico de modelos) — manter isolado para evitar acoplamento