import { expect, type Page } from '@playwright/test';

export const ADMIN = { username: process.env.E2E_USERNAME!, password: process.env.E2E_PASSWORD! };

export async function login(page: Page, username = ADMIN.username, password = ADMIN.password) {
  await page.goto('/studio/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function loginAsAdmin(page: Page) {
  await login(page);
  await expect(page).toHaveURL(/\/studio$/);
}
