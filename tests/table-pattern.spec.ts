import { test, expect } from '@playwright/test';

test.describe('Admin – Table Pattern', () => {
  test('search debounce + shows results', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Type in search box
    const searchInput = page.getByRole('textbox', { name: /ค้นหา/i });
    await searchInput.fill('central');
    
    // Wait for debounce (350ms + buffer)
    await page.waitForTimeout(450);
    
    // Should show results
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
  });

  test('sort by column toggles asc/desc', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Click on sortable column header
    const sortableHeader = page.getByRole('columnheader', { name: /ชื่อห้างสรรพสินค้า/i });
    await sortableHeader.click();
    
    // Should show ascending sort
    await expect(sortableHeader).toHaveAttribute('aria-sort', 'ascending');
    
    // Click again for descending
    await sortableHeader.click();
    await expect(sortableHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('filter + reset returns to full list', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Get initial row count
    const initialRows = await page.locator('tbody tr').count();
    
    // Apply district filter if available
    const districtFilter = page.getByLabel(/ฟิลเตอร์ เขต/i);
    if (await districtFilter.isVisible()) {
      await districtFilter.selectOption({ index: 1 }); // Select first non-empty option
      
      // Should show filtered results
      await expect(page.locator('tbody tr')).toHaveCount.lessThan(initialRows);
      
      // Reset filters
      await page.getByRole('button', { name: /รีเซ็ต/i }).click();
      
      // Should return to full list
      await expect(page.locator('tbody tr')).toHaveCount(initialRows);
    }
  });

  test('pagination controls work', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check if pagination exists
    const pagination = page.locator('[role="navigation"]').or(page.locator('text=หน้า'));
    if (await pagination.isVisible()) {
      // Change page size
      const pageSizeSelect = page.getByLabel(/จำนวนต่อหน้า/i);
      if (await pageSizeSelect.isVisible()) {
        await pageSizeSelect.selectOption('10');
      }
      
      // Navigate to next page if available
      const nextButton = page.getByRole('button', { name: /หน้าถัดไป/i });
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await expect(page.getByText(/หน้า 2\//)).toBeVisible();
      }
    }
  });

  test('table has proper accessibility attributes', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check search input has aria-label
    const searchInput = page.getByRole('textbox', { name: /ค้นหา/i });
    await expect(searchInput).toBeVisible();
    
    // Check table headers have proper attributes
    const headers = page.locator('th[aria-sort]');
    await expect(headers).toHaveCount.greaterThan(0);
    
    // Check action buttons have aria-labels
    const actionButtons = page.locator('[aria-label*="แก้ไข"], [aria-label*="ลบ"]');
    await expect(actionButtons).toHaveCount.greaterThan(0);
  });

  test('empty state shows when no results', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Search for something that doesn't exist
    const searchInput = page.getByRole('textbox', { name: /ค้นหา/i });
    await searchInput.fill('nonexistentmall12345');
    
    // Wait for debounce
    await page.waitForTimeout(450);
    
    // Should show empty state
    await expect(page.getByText(/ไม่พบผลลัพธ์/i)).toBeVisible();
  });

  test('hover states work on table rows', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Hover over first row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.hover();
    
    // Should have hover effect (this is visual, but we can check the class is applied)
    await expect(firstRow).toHaveClass(/hover:bg-gray-50/);
  });
});
