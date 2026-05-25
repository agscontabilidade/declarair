## Diagnóstico

1. **Carrega em dark ao atualizar** — `ThemeProvider` inicia com `'system'`, e o `system` resolve para a preferência do SO do cliente. Como 100% dos clientes têm `tema_preferido = 'system'` no banco (default da coluna), quem usa SO em dark vê o portal em dark a cada refresh.
2. **Logo** — `ClienteLayout` usa sempre `logo-full.png` (versão escura sobre fundo claro). Existe `logo-dark.png` (versão branca, ideal para fundo escuro) que não está sendo usada.

## Correções

### 1. Default = light no portal do cliente (sem afetar contador)

Em `src/components/layout/ClienteLayout.tsx`, adicionar um `useEffect` que roda na montagem do portal:

- Se `theme === 'system'` (ou seja, cliente nunca escolheu manualmente), chamar `setTheme('light')`. Isso aplica claro imediatamente e persiste a preferência no banco (`clientes.tema_preferido = 'light'`).
- Se o cliente já escolheu `dark` ou `light` manualmente pelo toggle, mantém a escolha.
- Não toca em contador (ThemeContext fica intacto; mudança é só dentro do `ClienteLayout`).

### 2. Logo branco no dark mode

Em `src/components/layout/ClienteLayout.tsx`:

- Importar `logoDark from '@/assets/logo-dark.png'`.
- Ler `resolved` do `useTheme()`.
- Renderizar `resolved === 'dark' ? logoDark : logoFull` quando NÃO houver whitelabel (no whitelabel, mantém `esc.logo_url` como hoje).

## Arquivos afetados

- `src/components/layout/ClienteLayout.tsx` — único arquivo.

## Fora de escopo

- Contador, admin, landing.
- ThemeContext global (não mexer).
- Whitelabel (logo customizado do escritório continua igual).