import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const unique = () => Date.now().toString(36);

test('write, publish, unpublish and delete an essay; public site updates immediately', async ({ page, request }) => {
  const title = `E2E Essay ${unique()}`;
  const slug = title.toLowerCase().replace(/\s+/g, '-');

  await loginAsAdmin(page);
  await page.getByRole('link', { name: 'New essay' }).first().click();
  await page.getByLabel('Title').fill(title);
  await expect(page.getByLabel('URL slug')).toHaveValue(slug);
  await page.getByLabel('Excerpt').fill('An end-to-end test essay.');
  await page
    .getByLabel('Essay')
    .fill('## A heading\n\nSome **bold** text.\n\n<script>window.__pwned = true</script>\n\n[x](javascript:alert(1))');
  await page.getByRole('tab', { name: 'preview' }).click();
  await expect(page.getByRole('heading', { name: 'A heading' })).toBeVisible();
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published. It’s live at').or(page.getByText("Published. It's live at"))).toBeVisible();

  // Live on the public site (on-demand rendering + cache invalidation).
  const pub = await page.context().newPage();
  await pub.goto(`/posts/${slug}`);
  await expect(pub.getByRole('heading', { name: 'A heading' })).toBeVisible();
  await expect(pub.locator('strong', { hasText: 'bold' })).toBeVisible();
  expect(await pub.evaluate(() => (window as unknown as { __pwned?: boolean }).__pwned)).toBeUndefined();
  expect(await pub.locator('a[href^="javascript:"]').count()).toBe(0);
  await pub.goto('/');
  await expect(pub.getByRole('link', { name: title })).toBeVisible();

  // Unpublish → disappears.
  await page.getByRole('button', { name: 'Unpublish (move to drafts)' }).click();
  await expect(page.getByText('Saved as a draft')).toBeVisible();
  expect((await request.get(`/posts/${slug}`)).status()).toBe(404);

  // Delete.
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete essay' }).click();
  await expect(page).toHaveURL(/\/studio\/posts\?deleted=1/);
  await expect(page.getByRole('link', { name: title })).toHaveCount(0);
});

test('duplicate slugs show a field error', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/studio/posts/new');
  await page.getByLabel('Title').fill('Duplicate');
  await page.getByLabel('URL slug').fill('what-makes-me-think');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByText('This slug is already used by another essay')).toBeVisible();
});

test('upload a PDF document, publish it, download it, delete it', async ({ page, request }) => {
  const title = `E2E Doc ${unique()}`;
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  const pdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
  );

  await loginAsAdmin(page);
  await page.goto('/studio/documents/new');
  await page.getByLabel('PDF file').setInputFiles({ name: 'e2e.pdf', mimeType: 'application/pdf', buffer: pdf });
  await expect(page.getByText('✓ e2e.pdf ready')).toBeVisible();
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill('Uploaded by the E2E suite.');
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText(/Published\. It.s listed on/)).toBeVisible();

  const file = await request.get(`/documents/${slug}`);
  expect(file.status()).toBe(200);
  expect((await file.body()).subarray(0, 5).toString()).toBe('%PDF-');

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete document' }).click();
  await expect(page).toHaveURL(/\/studio\/documents\?deleted=1/);
  expect((await request.get(`/documents/${slug}`)).status()).toBe(404);
});

test('non-PDF uploads are rejected in the browser', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/studio/documents/new');
  await page.getByLabel('PDF file').setInputFiles({ name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  await expect(page.getByText('Only PDF files are allowed.')).toBeVisible();
});
