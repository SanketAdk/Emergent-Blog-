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

test('admin can change password (and change it back)', async ({ page }) => {
  const temp = 'Temporary-Passw0rd-XYZ';
  await loginAsAdmin(page);
  await page.goto('/studio/account');

  await page.getByLabel('Current password').fill('not-my-password');
  await page.getByLabel('New password', { exact: true }).fill(temp);
  await page.getByLabel('Repeat new password').fill(temp);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Current password is incorrect')).toBeVisible();

  await page.getByLabel('Current password').fill(ADMIN.password);
  await page.getByLabel('New password', { exact: true }).fill('short');
  await page.getByLabel('Repeat new password').fill('short');
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Use at least 12 characters')).toBeVisible();

  await page.getByLabel('Current password').fill(ADMIN.password);
  await page.getByLabel('New password', { exact: true }).fill(temp);
  await page.getByLabel('Repeat new password').fill(temp);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Password changed.')).toBeVisible();

  // Restore the original password for other tests.
  await page.getByLabel('Current password').fill(temp);
  await page.getByLabel('New password', { exact: true }).fill(ADMIN.password);
  await page.getByLabel('Repeat new password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Password changed.')).toBeVisible();
});
