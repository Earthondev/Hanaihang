import { test, expect } from '@playwright/test';

test.describe('Form Validation & Submit', () => {
  test.describe('MallForm – Validation & Submit', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin?tab=malls');
      await page.getByRole('button', { name: /เพิ่มห้างใหม่/i }).click();
    });

    test('shows validation errors for required fields', async ({ page }) => {
      await page.getByRole('button', { name: /สร้างห้าง/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/กรุณากรอกชื่อห้างอย่างน้อย 2 ตัวอักษร/i)).toBeVisible();
      await expect(page.getByText(/กรุณาเลือกเขต\/อำเภอ/i)).toBeVisible();
      await expect(page.getByText(/กรุณากรอกที่อยู่ให้ครบถ้วน/i)).toBeVisible();
    });

    test('phone & url formats are validated', async ({ page }) => {
      // Fill required fields
      await page.getByLabel(/ชื่อห้างสรรพสินค้า/i).fill('Test Mall');
      await page.getByLabel(/เขต\/อำเภอ/i).selectOption('ปทุมวัน');
      await page.getByLabel(/ที่อยู่/i).fill('123 ถนน ทดสอบ กรุงเทพฯ');
      
      // Fill invalid phone and URL
      await page.getByLabel(/เบอร์โทร/i).fill('abcd');
      await page.getByLabel(/เว็บไซต์/i).fill('example.com');
      
      await page.getByRole('button', { name: /สร้างห้าง/i }).click();
      
      // Check for format validation errors
      await expect(page.getByText(/รูปแบบเบอร์โทรไม่ถูกต้อง/i)).toBeVisible();
      await expect(page.getByText(/URL ต้องขึ้นต้นด้วย http/i)).toBeVisible();
    });

    test('submits successfully with valid data', async ({ page }) => {
      // Fill all required fields with valid data
      await page.getByLabel(/ชื่อห้างสรรพสินค้า/i).fill('QA Mall ' + Date.now());
      await page.getByLabel(/เขต\/อำเภอ/i).selectOption('ปทุมวัน');
      await page.getByLabel(/ที่อยู่/i).fill('123 ถนน ทดสอบ กรุงเทพฯ');
      await page.getByLabel(/เบอร์โทร/i).fill('+66812345678');
      await page.getByLabel(/เว็บไซต์/i).fill('https://example.com');
      
      await page.getByRole('button', { name: /สร้างห้าง/i }).click();
      
      // Check for success message
      await expect(page.getByText(/สำเร็จ|สร้างห้างสรรพสินค้าสำเร็จ/i)).toBeVisible({ timeout: 5000 });
    });

    test('auto-generates slug from display name', async ({ page }) => {
      await page.getByLabel(/ชื่อห้างสรรพสินค้า/i).fill('Test Mall Name');
      
      // Wait a bit for the slug generation
      await page.waitForTimeout(500);
      
      // The name field should be auto-filled with slug
      const nameField = page.getByLabel(/ชื่อ/i);
      await expect(nameField).toHaveValue('test-mall-name');
    });

    test('form has proper accessibility attributes', async ({ page }) => {
      // Check for required field indicators
      const requiredFields = page.locator('label:has-text("*")');
      await expect(requiredFields).toHaveCount.greaterThan(0);
      
      // Check for aria-describedby on fields with helper text
      const fieldsWithHelper = page.locator('[aria-describedby]');
      await expect(fieldsWithHelper).toHaveCount.greaterThan(0);
    });
  });

  test.describe('StoreForm – Validation & Submit', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin?tab=stores');
      await page.getByRole('button', { name: /เพิ่มร้านค้าใหม่/i }).click();
    });

    test('shows validation errors for required fields', async ({ page }) => {
      await page.getByRole('button', { name: /เพิ่มร้านค้า/i }).click();
      
      // Check for validation errors
      await expect(page.getByText(/กรุณาเลือกห้าง/i)).toBeVisible();
      await expect(page.getByText(/กรุณากรอกชื่อร้านอย่างน้อย 2 ตัวอักษร/i)).toBeVisible();
      await expect(page.getByText(/กรุณาเลือกชั้น/i)).toBeVisible();
    });

    test('loads floors when mall is selected', async ({ page }) => {
      // Wait for malls to load
      await page.waitForSelector('select[name="mallId"] option:not([value=""])', { timeout: 10000 });
      
      // Select a mall
      await page.getByLabel(/ห้างสรรพสินค้า/i).selectOption({ index: 1 });
      
      // Wait for floors to load
      await page.waitForTimeout(1000);
      
      // Check that floor dropdown is enabled and has options
      const floorSelect = page.getByLabel(/ชั้น/i);
      await expect(floorSelect).toBeEnabled();
      
      // Should have floor options (G, 1, 2, 3, etc.)
      const floorOptions = page.locator('select[name="floorId"] option:not([value=""])');
      await expect(floorOptions).toHaveCount.greaterThan(0);
    });

    test('submits successfully with valid data', async ({ page }) => {
      // Wait for malls to load
      await page.waitForSelector('select[name="mallId"] option:not([value=""])', { timeout: 10000 });
      
      // Fill all required fields
      await page.getByLabel(/ห้างสรรพสินค้า/i).selectOption({ index: 1 });
      await page.waitForTimeout(1000); // Wait for floors to load
      await page.getByLabel(/ชั้น/i).selectOption({ index: 1 });
      await page.getByLabel(/ชื่อร้านค้า/i).fill('QA Store ' + Date.now());
      await page.getByLabel(/หมวดหมู่/i).selectOption('Fashion');
      await page.getByLabel(/สถานะ/i).selectOption('Active');
      
      await page.getByRole('button', { name: /เพิ่มร้านค้า/i }).click();
      
      // Check for success message
      await expect(page.getByText(/สำเร็จ|เพิ่มร้านค้าสำเร็จ/i)).toBeVisible({ timeout: 5000 });
    });

    test('phone format validation works', async ({ page }) => {
      // Fill required fields first
      await page.waitForSelector('select[name="mallId"] option:not([value=""])', { timeout: 10000 });
      await page.getByLabel(/ห้างสรรพสินค้า/i).selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.getByLabel(/ชั้น/i).selectOption({ index: 1 });
      await page.getByLabel(/ชื่อร้านค้า/i).fill('Test Store');
      await page.getByLabel(/หมวดหมู่/i).selectOption('Fashion');
      await page.getByLabel(/สถานะ/i).selectOption('Active');
      
      // Fill invalid phone
      await page.getByLabel(/เบอร์โทร/i).fill('invalid-phone');
      
      await page.getByRole('button', { name: /เพิ่มร้านค้า/i }).click();
      
      // Check for phone validation error
      await expect(page.getByText(/รูปแบบเบอร์โทรไม่ถูกต้อง/i)).toBeVisible();
    });
  });

  test.describe('Form UX & Accessibility', () => {
    test('form layout is responsive', async ({ page }) => {
      await page.goto('/admin?tab=malls');
      await page.getByRole('button', { name: /เพิ่มห้างใหม่/i }).click();
      
      // Check desktop layout (2 columns)
      await page.setViewportSize({ width: 1024, height: 768 });
      const formGrid = page.locator('.grid');
      await expect(formGrid).toHaveClass(/md:grid-cols-2/);
      
      // Check mobile layout (1 column)
      await page.setViewportSize({ width: 375, height: 667 });
      // Grid should still be present but single column on mobile
      await expect(formGrid).toBeVisible();
    });

    test('form actions show proper loading states', async ({ page }) => {
      await page.goto('/admin?tab=malls');
      await page.getByRole('button', { name: /เพิ่มห้างใหม่/i }).click();
      
      // Fill form with valid data
      await page.getByLabel(/ชื่อห้างสรรพสินค้า/i).fill('Loading Test Mall');
      await page.getByLabel(/เขต\/อำเภอ/i).selectOption('ปทุมวัน');
      await page.getByLabel(/ที่อยู่/i).fill('123 Test Street');
      
      // Submit form
      const submitButton = page.getByRole('button', { name: /สร้างห้าง/i });
      await submitButton.click();
      
      // Check loading state
      await expect(submitButton).toBeDisabled();
      await expect(submitButton).toHaveText(/กำลังบันทึก/i);
    });

    test('form has proper focus management', async ({ page }) => {
      await page.goto('/admin?tab=malls');
      await page.getByRole('button', { name: /เพิ่มห้างใหม่/i }).click();
      
      // Tab through form fields
      await page.keyboard.press('Tab');
      
      // First field should be focused
      const firstField = page.getByLabel(/ชื่อห้างสรรพสินค้า/i);
      await expect(firstField).toBeFocused();
      
      // Continue tabbing
      await page.keyboard.press('Tab');
      const secondField = page.getByLabel(/เขต\/อำเภอ/i);
      await expect(secondField).toBeFocused();
    });
  });
});
