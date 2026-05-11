## Problema identificado

Quando um cliente se cadastra pelo link de convite, o sistema cria automaticamente a declaração com `ano_base = anoAtual - 1`. Como `new Date().getFullYear()` retorna **2026**, a declaração nasce com **ano_base = 2025** — por isso todos os documentos enviados pelo cliente caem na pasta "2025" do Drive (que filtra por `declaracoes.ano_base`).

Comparação:
- `useClientes.ts` (cadastro feito pelo contador): usa `new Date().getFullYear()` → 2026 ✅
- `register-from-invite/index.ts` (autocadastro via link): usa `anoAtual - 1` → 2025 ❌
- `register-from-direct-invite/index.ts` (convite direto): usa `anoAtual - 1` → 2025 ❌

## Correção

Alterar as duas edge functions para usar o ano corrente (2026), igualando-se ao restante do sistema (Drive, NovaDeclaracaoModal, useClientes).

### Arquivos a editar

1. **`supabase/functions/register-from-invite/index.ts`** (linha 92)
   - De: `ano_base: anoAtual - 1,`
   - Para: `ano_base: anoAtual,`

2. **`supabase/functions/register-from-direct-invite/index.ts`** (linha 89)
   - De: `ano_base: anoAtual - 1,`
   - Para: `ano_base: anoAtual,`

Após salvar, as edge functions são redeployadas automaticamente.

## Backfill (opcional — pergunto antes de aplicar)

As declarações já existentes criadas com `ano_base = 2025` continuam apontando para 2025. Posso rodar uma migração que move para 2026 todas as declarações com `ano_base = 2025` que ainda **não foram transmitidas** (status ≠ 'transmitida'), junto com seus respectivos `formulario_ir`. Declarações de 2025 já transmitidas ficam intactas (são histórico real). Quer que eu inclua esse backfill no mesmo passo?

## Validação

1. Criar um cliente novo via link de convite → confirmar que a declaração aparece com ano-base 2026.
2. Cliente faz upload de um documento → arquivo aparece no Drive ao filtrar por 2026.