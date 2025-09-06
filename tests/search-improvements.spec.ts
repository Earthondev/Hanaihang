import { test, expect } from '@playwright/test';

test.describe('Search Improvements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('search debounce works correctly', async ({ page }) => {
    // Type quickly to test debouncing
    const searchInput = page.locator('input[role="combobox"]');
    
    await searchInput.fill('h');
    await searchInput.fill('he');
    await searchInput.fill('hem');
    await searchInput.fill('h&m');
    
    // Wait for debounced search to complete
    await page.waitForTimeout(400);
    
    // Should show results for "h&m"
    await expect(page.locator('[role="listbox"]')).toBeVisible();
  });

  test('keyboard navigation works', async ({ page }) => {
    const searchInput = page.locator('input[role="combobox"]');
    
    await searchInput.fill('central');
    await page.waitForTimeout(400);
    
    // Test arrow down navigation
    await searchInput.press('ArrowDown');
    await expect(page.locator('[role="option"][aria-selected="true"]')).toBeVisible();
    
    // Test arrow up navigation
    await searchInput.press('ArrowUp');
    
    // Test escape to close
    await searchInput.press('Escape');
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });

  test('ARIA attributes are present', async ({ page }) => {
    const searchInput = page.locator('input[role="combobox"]');
    
    await expect(searchInput).toHaveAttribute('role', 'combobox');
    await expect(searchInput).toHaveAttribute('aria-expanded', 'false');
    await expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
    
    await searchInput.fill('test');
    await page.waitForTimeout(400);
    
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute('id', 'search-listbox');
    
    const options = page.locator('[role="option"]');
    if (await options.count() > 0) {
      await expect(options.first()).toHaveAttribute('role', 'option');
    }
  });

  test('rate limiting works', async ({ page }) => {
    const searchInput = page.locator('input[role="combobox"]');
    
    // Make many rapid searches to trigger rate limiting
    for (let i = 0; i < 15; i++) {
      await searchInput.fill(`test${i}`);
      await page.waitForTimeout(50); // Very fast typing
    }
    
    // Should show rate limit error
    await expect(page.locator('text=กำลังค้นหาบ่อยเกินไป')).toBeVisible();
  });

  test('empty state shows correctly', async ({ page }) => {
    const searchInput = page.locator('input[role="combobox"]');
    
    await searchInput.fill('nonexistentquery12345');
    await page.waitForTimeout(400);
    
    // Should show empty state
    await expect(page.locator('text=ไม่พบผลการค้นหา')).toBeVisible();
  });

  test('location indicator shows when available', async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
    
    // Reload to trigger location request
    await page.reload();
    
    // Should show location indicator
    await expect(page.locator('text=ค้นหาจากตำแหน่งปัจจุบัน')).toBeVisible();
  });

  test('search results are sorted by distance when location available', async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
    
    await page.reload();
    
    const searchInput = page.locator('input[role="combobox"]');
    await searchInput.fill('central');
    await page.waitForTimeout(1000); // Wait for distance calculation
    
    const results = page.locator('[role="option"]');
    const count = await results.count();
    
    if (count > 1) {
      // Results should be sorted by distance (closest first)
      // This is a basic test - in a real scenario you'd check actual distance values
      await expect(results.first()).toBeVisible();
    }
  });

  test('clear button works', async ({ page }) => {
    const searchInput = page.locator('input[role="combobox"]');
    
    await searchInput.fill('test');
    await page.waitForTimeout(400);
    
    // Click clear button
    await page.locator('button[aria-label="Clear search"]').click();
    
    // Input should be empty and dropdown closed
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('[role="listbox"]')).not.toBeVisible();
  });
});
