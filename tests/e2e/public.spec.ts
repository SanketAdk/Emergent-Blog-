import { expect, test } from '@playwright/test';

test('home page lists published essays from the database', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('tab', { name: 'Essays' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Essays' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Essays' }).getByText('min read').first()).toBeVisible();
});

test('landing page: Documents tab switches the list; no Archive link in nav or footer', async ({ page }) => {
  await page.goto('/');

  const nav = page.getByRole('navigation').first();
  await expect(nav.getByRole('link', { name: 'Emergent Thoughts' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Archive' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Documents' })).toHaveCount(0);
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Archive' })).toHaveCount(0);

  const docsTab = page.getByRole('tab', { name: 'Documents' });
  await expect(docsTab).toHaveAttribute('aria-selected', 'false');
  await docsTab.click();
  await expect(docsTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Essays' })).toHaveAttribute('aria-selected', 'false');
  await expect(page.getByRole('tabpanel', { name: 'Documents' }).getByText('Cyclical Businesses Reference')).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'Essays' })).toBeHidden();

  // Keyboard: arrow keys move between tabs (WAI-ARIA tabs pattern).
  await docsTab.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Essays' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Essays' })).toHaveAttribute('aria-selected', 'true');
});

test('archive and documents routes still work (not linked from the landing page)', async ({ request }) => {
  expect((await request.get('/archive')).status()).toBe(200);
  expect((await request.get('/documents')).status()).toBe(200);
});

test('essay page renders and unknown essays 404', async ({ page }) => {
  await page.goto('/posts/what-makes-me-think');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/What Actually Makes me think/);
  const res = await page.goto('/posts/this-does-not-exist');
  expect(res?.status()).toBe(404);
});

test('published PDF is served through a signed URL; drafts are hidden', async ({ request }) => {
  const res = await request.get('/documents/cyclical-businesses-reference');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  expect((await request.get('/documents/test-document')).status()).toBe(404);
});

test('security headers are present', async ({ request }) => {
  const h = (await request.get('/')).headers();
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-powered-by']).toBeUndefined();
});
