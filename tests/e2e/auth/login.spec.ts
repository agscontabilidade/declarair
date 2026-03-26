import { test, expect } from '../../playwright-fixture';

test.describe('Login do Contador', () => {
  test('deve exibir formulário de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalido@teste.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/[Ee]rro/')).toBeVisible({ timeout: 10000 });
  });

  test('deve redirecionar para /login quando não autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('link para recuperar senha deve estar visível', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href="/recuperar-senha"]')).toBeVisible();
  });

  test('link para cadastro deve estar visível', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href="/cadastro"]')).toBeVisible();
  });
});

test.describe('Login do Cliente', () => {
  test('deve exibir formulário de login do cliente', async ({ page }) => {
    await page.goto('/cliente/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
