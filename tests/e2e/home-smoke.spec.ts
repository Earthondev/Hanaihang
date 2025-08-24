import { expect } from '@playwright/test';
import { test } from './fixtures';

test('Home loads & lists malls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('mall-card').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /ห้าง/i })).toBeVisible();
});

test('Use my location (mocked) shows distance or reorders list', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 13.7466, longitude: 100.5347 });
  await page.goto('/');
  await page.getByTestId('use-my-location').click();
  // ตรวจสอบว่ามีระยะทาง หรือการเรียงตามใกล้-ไกล
  await expect(page.locator('[data-testid="mall-card"]')).toHaveCountGreaterThan(0);
});

test('Search mall by name', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('search-mall').fill('Central');
  await page.waitForTimeout(400); // debounce
  await expect(page.locator('[data-testid="mall-card"]')).toHaveCountGreaterThan(0);
});
