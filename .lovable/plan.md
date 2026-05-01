# Correção definitiva: `Cannot find module 'tests/playwright-fixture'`

## Diagnóstico

Os 4 specs e2e (`auth/login`, `navigation/rotas-protegidas`, `navigation/rotas-publicas`, `ui/responsividade`) importam de `'../../playwright-fixture'`, ou seja, esperam o arquivo **`tests/playwright-fixture.ts`** — que **não existe** no repositório. Só existem:

- `tests/example.spec.ts`
- `tests/e2e/helpers/auth.ts` (helpers de login)

Resultado: `playwright test` falha em todos os 4 arquivos com `Cannot find module`, e o job `bun run test:e2e` morre com exit code 1 no GitHub Actions.

Além disso, o `playwright.config.ts` tem `baseURL: http://localhost:8080` mas **não inicia o dev server** (`webServer` ausente). Mesmo corrigindo o fixture, os testes continuariam falhando no CI por não ter app rodando.

## Plano de correção

### 1. Criar `tests/playwright-fixture.ts`

Fixture mínima que reexporta `test` e `expect` do Playwright, pronta para futuras extensões (ex.: usuário autenticado, contexto multi-tenant). Conteúdo:

```ts
import { test as base, expect } from '@playwright/test';

// Espaço para fixtures customizadas (auth, escritorio, etc.)
export const test = base.extend({});
export { expect };
```

Isso resolve imediatamente os 4 erros de import sem alterar nenhum spec.

### 2. Ajustar `playwright.config.ts` para o CI

- Adicionar bloco `webServer` que sobe o Vite antes dos testes:
  ```ts
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  }
  ```
- Restringir `testDir` para `./tests/e2e` (evita rodar `tests/example.spec.ts` solto e qualquer arquivo futuro fora de e2e).

### 3. Garantir que o workflow do GitHub instale browsers

Verificar `.github/workflows/*.yml` e, se necessário, adicionar antes do `bun run test:e2e`:
```
- run: bunx playwright install --with-deps chromium
```
(só edito se o passo não existir; sem isso o Playwright também falha no runner.)

### 4. Validação local (após aprovação)

- `bun run lint` continua verde (sem novos `any`).
- `bunx playwright test --list` deve listar todos os specs sem erro de módulo.

## Arquivos a alterar

- **criar** `tests/playwright-fixture.ts`
- **editar** `playwright.config.ts` (adiciona `webServer`, ajusta `testDir`)
- **editar** `.github/workflows/<ci>.yml` apenas se faltar `playwright install`

Sem mudanças em specs, helpers, ou código de aplicação.
