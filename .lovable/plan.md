## Problema

No `ComboboxField` (usado em `EditarCadastraisDialogs.tsx` para Ocupação principal e Natureza da ocupação), o primeiro item da lista fica colado na barra de busca, sem respiro, e o destaque verde do item ativo encosta na borda superior — o que gera a sensação de UI "grudada".

## Ajuste (apenas `src/components/declaracao/editar/EditarCadastraisDialogs.tsx`, função `ComboboxField`)

1. **Separador visual** entre o `CommandInput` e a lista:
   - Adicionar `border-b` no `CommandInput` (via wrapper) ou trocar `className` para `h-11 border-b border-border` — input um pouco mais alto, com linha sutil embaixo.

2. **Respiro interno na lista**:
   - `CommandList`: adicionar `p-1.5` (padding ao redor dos itens) e `scroll-py-1` para que itens não fiquem colados na borda ao rolar.
   - `CommandGroup`: aplicar `className="p-0"` para evitar padding duplicado do shadcn.

3. **Itens mais respirados e com cantos arredondados**:
   - `CommandItem`: trocar `border-b last:border-0 border-muted/20` por `rounded-md mb-0.5 last:mb-0` — itens individuais com radius, sem linha divisória pesada (ruído visual quando o item ativo está pintado de verde).
   - Manter `py-2.5 px-3`.

4. **CommandEmpty**: adicionar `py-6 text-sm text-muted-foreground text-center` para o estado vazio também respirar.

5. **PopoverContent**: aumentar `sideOffset` de `6` para `8` (afasta levemente do trigger) e adicionar `shadow-lg` para reforçar a separação do campo.

Sem mudanças em lógica, dados, schema ou nos outros usos de Popover/Command no projeto. Escopo restrito ao componente `ComboboxField` interno deste arquivo — afeta os dois selects de ocupação no diálogo de cadastrais.
