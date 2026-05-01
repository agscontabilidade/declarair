import { test as base, expect } from '@playwright/test';

/**
 * Fixture base do Playwright para os testes e2e do DeclaraIR.
 *
 * Reexporta `test` e `expect` do `@playwright/test` para que os specs em
 * `tests/e2e/**` possam importar de um único ponto:
 *
 *   import { test, expect } from '../../playwright-fixture';
 *
 * Use `base.extend({...})` aqui quando precisarmos adicionar fixtures
 * customizadas (ex.: contador autenticado, escritório seed, contexto
 * multi-tenant, etc.).
 */
export const test = base.extend({});
export { expect };
