import { Page } from '@playwright/test';

export async function loginContador(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForSelector('form');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

export async function loginCliente(page: Page, email: string, password: string) {
  await page.goto('/cliente/login');
  await page.waitForSelector('form');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/cliente/**', { timeout: 15000 });
}
