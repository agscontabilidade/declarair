import { test, expect } from '../../playwright-fixture';

test.describe('Rotas Públicas', () => {
  test('landing page deve carregar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DeclaraIR/i);
  });

  test('página de planos deve carregar', async ({ page }) => {
    await page.goto('/planos');
    await expect(page.getByRole('heading', { name: /plano/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('página de cadastro deve carregar', async ({ page }) => {
    await page.goto('/cadastro');
    await expect(page.getByRole('heading', { name: /Crie sua conta/i })).toBeVisible({ timeout: 10000 });
  });

  test('página de recuperar senha deve carregar', async ({ page }) => {
    await page.goto('/recuperar-senha');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('termos de uso deve carregar', async ({ page }) => {
    await page.goto('/termos-de-uso');
    await expect(page.getByRole('heading', { name: /Termos/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('política de privacidade deve carregar', async ({ page }) => {
    await page.goto('/politica-de-privacidade');
    await expect(page.getByRole('heading', { name: /Privacidade/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('página 404 para rota inexistente', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');
    await expect(page.getByText(/404|Página não encontrada/i).first()).toBeVisible({ timeout: 10000 });
  });
});
