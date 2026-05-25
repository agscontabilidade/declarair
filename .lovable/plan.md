## Problema

Na área do cliente, o logo no modo escuro está usando o asset `logo-dark.png`, que aparece com fundo claro/incorreto sobre o header escuro (ver screenshot). A área do contador (Sidebar) usa um padrão diferente: sempre carrega `logo-full.png` e aplica `brightness-0 invert` para deixar o logo branco sobre fundo escuro.

## Solução

Alinhar o `ClienteLayout` ao mesmo padrão do contador:

- Remover o import e o uso de `logo-dark.png`.
- Usar sempre `logo-full.png`.
- Aplicar `dark:brightness-0 dark:invert` na `<img>` para que no tema escuro o logo fique branco (igual ao contador), e no tema claro permaneça com as cores originais.
- Remover o uso de `resolved` do `useTheme` que só servia para alternar o asset (manter o resto do hook se ainda for usado; caso contrário, limpar o import).

## Arquivo afetado

- `src/components/layout/ClienteLayout.tsx` (apenas a parte de renderização do logo padrão — branding whitelabel continua intacto).

## Fora de escopo

- Sidebar do contador, AdminLayout, assets, theme system, lógica de whitelabel.