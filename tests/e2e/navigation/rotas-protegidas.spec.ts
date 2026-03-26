import { test, expect } from '../../playwright-fixture';

const rotasProtegidas = [
  '/dashboard',
  '/clientes',
  '/cobrancas',
  '/mensagens',
  '/configuracoes',
];

test.describe('Rotas Protegidas - Redirecionamento', () => {
  for (const rota of rotasProtegidas) {
    test(`${rota} deve redirecionar para login`, async ({ page }) => {
      await page.goto(rota);
      await page.waitForURL('**/login', { timeout: 10000 });
      expect(page.url()).toContain('/login');
    });
  }
});
