## Objetivo
Adicionar um botão ao lado do CPF (mascarado) de cada linha da listagem em `/declaracoes` para copiar o CPF sem pontuação (apenas dígitos) para a área de transferência.

## Arquivo afetado
- `src/pages/Declaracoes.tsx` (célula que renderiza nome + CPF mascarado do cliente na tabela)

## Implementação
1. Localizar a célula que mostra `nome` + CPF mascarado (`335.***.***-59` no print).
2. Ao lado do CPF, adicionar um `Button` ícone `size="icon"` com `variant="ghost"` (h-6 w-6) usando ícone `Copy` do `lucide-react`.
3. `onClick` (com `e.stopPropagation()` para não disparar navegação da linha):
   - `navigator.clipboard.writeText(cpf.replace(/\D/g, ''))`
   - Toast de sucesso "CPF copiado" usando `useToast` (já padrão do projeto).
   - Em erro, toast destrutivo "Não foi possível copiar".
4. `aria-label="Copiar CPF"` e `title="Copiar CPF (sem pontos)"`.
5. Trocar ícone para `Check` por ~1.5s após copiar (feedback visual), usando estado local por linha (`copiedId`).

## Escopo
Apenas UI da listagem `/declaracoes`. Sem mudanças em hooks, schema, RLS ou outras telas.