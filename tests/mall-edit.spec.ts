import { test, expect } from '@playwright/test';

test.describe('Mall Edit Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel
    await page.goto('/admin?tab=malls');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="malls-table"]', { timeout: 10000 });
  });

  test('should navigate to edit page when clicking edit button', async ({ page }) => {
    // Find and click the first edit button
    const editButton = page.locator('a[href*="/admin/malls/"][href*="/edit"]').first();
    await expect(editButton).toBeVisible();
    
    // Get the mall name for verification
    const mallName = await page.locator('tr').first().locator('td').nth(0).textContent();
    
    // Click edit button
    await editButton.click();
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/admin\/malls\/.*\/edit/);
    
    // Should show edit page header
    await expect(page.getByRole('heading', { name: /แก้ไขห้าง:/ })).toBeVisible();
    
    // Should show the mall name in the header
    if (mallName) {
      await expect(page.getByText(mallName.trim())).toBeVisible();
    }
  });

  test('should load existing mall data in form', async ({ page }) => {
    // Get mall data from table
    const firstRow = page.locator('tr').nth(1); // Skip header row
    const mallName = await firstRow.locator('td').nth(0).textContent();
    const mallDistrict = await firstRow.locator('td').nth(1).textContent();
    
    // Click edit button
    const editButton = page.locator('a[href*="/admin/malls/"][href*="/edit"]').first();
    await editButton.click();
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check that form fields are populated
    const nameInput = page.getByLabel('ชื่อห้าง');
    await expect(nameInput).toHaveValue(mallName?.trim() || '');
    
    const districtSelect = page.getByLabel('เขต/จังหวัด');
    await expect(districtSelect).toHaveValue(mallDistrict?.trim() || '');
  });

  test('should update mall data successfully', async ({ page }) => {
    // Navigate to edit page
    const editButton = page.locator('a[href*="/admin/malls/"][href*="/edit"]').first();
    await editButton.click();
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Get original name
    const nameInput = page.getByLabel('ชื่อห้าง');
    const originalName = await nameInput.inputValue();
    
    // Update the name
    const newName = `${originalName} (Updated)`;
    await nameInput.fill(newName);
    
    // Submit the form
    const submitButton = page.getByRole('button', { name: /บันทึกการแก้ไข/ });
    await submitButton.click();
    
    // Should show success toast
    await expect(page.getByText(/อัปเดตสำเร็จ/)).toBeVisible();
    
    // Should navigate back to malls list
    await expect(page).toHaveURL(/\/admin\?tab=malls/);
    
    // Should show updated name in table
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    // Navigate to edit page
    const editButton = page.locator('a[href*="/admin/malls/"][href*="/edit"]').first();
    await editButton.click();
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Clear required field
    const nameInput = page.getByLabel('ชื่อห้าง');
    await nameInput.clear();
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /บันทึกการแก้ไข/ });
    await submitButton.click();
    
    // Should show validation error
    await expect(page.getByText(/กรุณากรอกชื่อห้าง/)).toBeVisible();
  });

  test('should cancel edit and return to list', async ({ page }) => {
    // Navigate to edit page
    const editButton = page.locator('a[href*="/admin/malls/"][href*="/edit"]').first();
    await editButton.click();
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Click cancel button
    const cancelButton = page.getByRole('button', { name: /ยกเลิก/ });
    await cancelButton.click();
    
    // Should navigate back to malls list
    await expect(page).toHaveURL(/\/admin\?tab=malls/);
  });

  test('should handle non-existent mall', async ({ page }) => {
    // Navigate to a non-existent mall edit page
    await page.goto('/admin/malls/non-existent-mall/edit');
    
    // Should show error message
    await expect(page.getByText(/ไม่พบห้าง/)).toBeVisible();
    
    // Should have a button to go back to list
    await expect(page.getByRole('button', { name: /กลับไปรายการห้าง/ })).toBeVisible();
  });
});
