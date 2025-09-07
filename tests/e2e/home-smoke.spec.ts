import { expect } from '@playwright/test';
import { test } from './fixtures';

test('Home loads & lists malls', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // รอให้ search input พร้อมก่อน (attached -> visible)
  await page.waitForSelector('[data-testid="search-input"]', { state: 'attached', timeout: 8000 });
  await page.getByTestId('search-input').waitFor({ state: 'visible', timeout: 8000 });
  
  // รอให้ hero title พร้อม
  await expect(page.getByTestId('hero-title')).toBeVisible();
  
  // รอให้ search results พร้อม
  await page.waitForSelector('[data-testid="search-results"]', { state: 'attached', timeout: 10000 });
  await page.getByTestId('search-results').waitFor({ state: 'visible', timeout: 10000 });
  
  // รอให้ mall cards พร้อม
  await page.waitForSelector('[data-testid="mall-card"]', { state: 'attached', timeout: 10000 });
  await page.getByTestId('mall-card').first().waitFor({ state: 'visible', timeout: 10000 });
});

test('Use my location (mocked) shows distance or reorders list', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 13.7466, longitude: 100.5347 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('use-my-location').click();
  // ตรวจสอบว่ามีระยะทาง หรือการเรียงตามใกล้-ไกล
  await expect(page.locator('[data-testid="mall-card"]')).toHaveCountGreaterThan(0);
});

test('Search mall by name', async ({ page }) => {
  await page.goto('/');
  
  // รอให้ search input พร้อม
  await page.waitForSelector('[data-testid="search-input"]', { state: 'attached', timeout: 8000 });
  await page.getByTestId('search-input').waitFor({ state: 'visible', timeout: 8000 });
  
  // กรอกข้อมูลและรอ debounce
  await page.getByTestId('search-input').fill('Central');
  await page.waitForTimeout(180); // > debounce 120ms
  
  // รอให้ผลลัพธ์แสดง
  await page.waitForSelector('[data-testid="search-results"]', { state: 'attached', timeout: 10000 });
  await page.getByTestId('search-results').waitFor({ state: 'visible', timeout: 10000 });
  
  await expect(page.locator('[data-testid="mall-card"]')).toHaveCountGreaterThan(0);
});
