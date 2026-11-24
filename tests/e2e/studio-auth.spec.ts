import { expect, test } from '@playwright/test';
import { ADMIN, login, loginAsAdmin } from './helpers';

test('anonymous visitors are redirected from /studio to login', async ({ page }) => {
  await page.goto('/studio/posts');
  await expect(page).toHaveURL(/\/studio\/login\?next=%2Fstudio%2Fposts/);
});

test('wrong password and unknown user show the same generic error', async ({ page }) => {
  await login(page, ADMIN.username, 'wrong-password-123');
  await expect(page.locator('main [role="alert"]')).toHaveText('Invalid username or password.');
  await login(page, 'no_such_user', 'whatever-password-1');
  await expect(page.locator('main [role="alert"]')).toHaveText('Invalid username or password.');
});

test('open redirects via ?next= are blocked', async ({ page }) => {
  await page.goto('/studio/login?next=https://evil.example');
  await page.getByLabel('Username').fill(ADMIN.username);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/localhost:\d+\/studio$/);
});

test('admin can log in and out', async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/studio\/login/);
  await page.goto('/studio');
  await expect(page).toHaveURL(/\/studio\/login/);
});

test('a username is locked after 5 failed attempts', async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await login(page, 'lockout_target', `bad-password-${i}`);
    await expect(page.locator('main [role="alert"]')).toHaveText('Invalid username or password.');
  }
  await login(page, 'lockout_target', 'bad-password-final');
  await expect(page.locator('main [role="alert"]')).toContainText('Too many failed attempts');
});
