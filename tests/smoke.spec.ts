import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - HaaNaiHang', () => {
  const baseUrl = 'https://hanaihang.netlify.app';

  test('TC-HP-01 | Header Buttons Navigation', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Test "สร้างห้าง" button
    await page.getByTestId('create-mall-btn').click();
    await expect(page).toHaveURL(/\/admin(\?.*)?$/);
    
    // Go back and test "เพิ่มร้าน" button
    await page.goto(baseUrl);
    await page.getByTestId('add-store-btn').click();
    await expect(page).toHaveURL(/\/admin\?tab=stores$/);
  });

  test('TC-HP-02 | Action Buttons Navigation', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Test "สร้างห้าง" action button
    await page.getByTestId('create-mall-action-btn').click();
    await expect(page).toHaveURL(/\/admin(\?.*)?$/);
    
    // Go back and test "เพิ่มร้าน" action button
    await page.goto(baseUrl);
    await page.getByTestId('add-store-action-btn').click();
    await expect(page).toHaveURL(/\/admin\?tab=stores$/);
  });

  test('TC-MOB-01 | Mobile Icon-only Buttons', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseUrl);
    
    // Check that buttons are visible and clickable
    const createMallBtn = page.getByTestId('create-mall-btn');
    const addStoreBtn = page.getByTestId('add-store-btn');
    
    await expect(createMallBtn).toBeVisible();
    await expect(addStoreBtn).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(createMallBtn).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(addStoreBtn).toBeFocused();
    
    // Test click functionality
    await addStoreBtn.click();
    await expect(page).toHaveURL(/\/admin\?tab=stores$/);
  });

  test('TC-ADMIN-01 | URL Parameter Tab Selection', async ({ page }) => {
    // Test stores tab
    await page.goto(`${baseUrl}/admin?tab=stores`);
    await expect(page.getByTestId('stores-tab')).toHaveClass(/bg-green-100/);
    
    // Test malls tab
    await page.goto(`${baseUrl}/admin?tab=malls`);
    await expect(page.getByTestId('malls-tab')).toHaveClass(/bg-green-100/);
    
    // Test invalid tab parameter (should fallback to stores)
    await page.goto(`${baseUrl}/admin?tab=invalid`);
    await expect(page).toHaveURL(/\/admin\?tab=stores$/);
    await expect(page.getByTestId('stores-tab')).toHaveClass(/bg-green-100/);
  });

  test('TC-ADMIN-02 | Tab Switching and URL Sync', async ({ page }) => {
    await page.goto(`${baseUrl}/admin`);
    
    // Switch to stores tab
    await page.getByTestId('stores-tab').click();
    await expect(page).toHaveURL(/\/admin\?tab=stores$/);
    await expect(page.getByTestId('stores-tab')).toHaveClass(/bg-green-100/);
    
    // Switch to malls tab
    await page.getByTestId('malls-tab').click();
    await expect(page).toHaveURL(/\/admin\?tab=malls$/);
    await expect(page.getByTestId('malls-tab')).toHaveClass(/bg-green-100/);
  });

  test('TC-A11Y-01 | Accessibility and Focus Management', async ({ page }) => {
    await page.goto(baseUrl);
    
    // Test focus ring visibility
    await page.keyboard.press('Tab');
    const createMallBtn = page.getByTestId('create-mall-btn');
    await expect(createMallBtn).toBeFocused();
    
    // Check for focus ring (should have focus:ring-2 class)
    await expect(createMallBtn).toHaveClass(/focus:ring-2/);
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/admin(\?.*)?$/);
  });

  test('TC-ANALYTICS-01 | Analytics Events Tracking', async ({ page }) => {
    // Mock gtag function
    await page.addInitScript(() => {
      (window as any).gtag = (eventName: string, params: any) => {
        (window as any).__analyticsEvents = (window as any).__analyticsEvents || [];
        (window as any).__analyticsEvents.push({ eventName, params });
      };
    });
    
    await page.goto(baseUrl);
    
    // Click create mall button
    await page.getByTestId('create-mall-btn').click();
    
    // Check if analytics event was fired
    const events = await page.evaluate(() => (window as any).__analyticsEvents || []);
    const createMallEvent = events.find((e: any) => e.eventName === 'click_create_mall');
    expect(createMallEvent).toBeDefined();
    expect(createMallEvent.params.event_category).toBe('admin_actions');
  });
});
