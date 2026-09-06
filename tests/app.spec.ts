import { expect, test } from '@playwright/test';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR4nGP8z8DAwMDAxMDAwMAAAAwAAf6nB1EAAAAASUVORK5CYII=',
  'base64',
);

async function upload(page: Parameters<typeof test>[0] extends never ? never : any, names: string[]) {
  await page.locator('input[type="file"]').setInputFiles(
    names.map((name) => ({ name, mimeType: 'image/png', buffer: png })),
  );
}

test('shows privacy-first landing UI and CPU fallback in headless Chromium', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Compress images without uploading them' })).toBeVisible();
  await expect(page.getByText('Local only')).toBeVisible();
  await expect(page.getByText('WASM CPU')).toBeVisible();
});

test('supports multi-image upload and clearing the batch', async ({ page }) => {
  await page.goto('/');
  await upload(page, ['first.png', 'second.png']);

  await expect(page.getByText('first.png')).toBeVisible();
  await expect(page.getByText('second.png')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Batch/ })).toContainText('2');
  await expect(page.getByText('0/2 compressed')).toBeVisible();

  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.getByText('first.png')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compress All' })).toHaveCount(0);
});

test('switches compression modes and exposes custom quality control', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'custom' }).click();

  const slider = page.locator('input[type="range"]');
  await expect(slider).toBeVisible();
  await slider.fill('75');
  await expect(page.getByText('75', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'lossless' }).click();
  await expect(page.getByText('WebP lossless preserves decoded pixel data.')).toBeVisible();
});

test('compresses an image locally and downloads WebP output', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'custom' }).click();
  await upload(page, ['photo.png']);

  await page.getByRole('button', { name: 'Compress All' }).click();
  await expect(page.getByText('1/1 compressed')).toBeVisible({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download All' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('photo.webp');
});
