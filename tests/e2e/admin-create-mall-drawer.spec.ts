import { test, expect } from './fixtures';

test('Open drawer & create mall successfully', async ({ page }) => {
  await page.goto('/admin?tab=malls');

  await page.getByTestId('open-create-mall').click();
  await expect(page.getByTestId('mall-form')).toBeVisible();

  await page.getByTestId('mall-name').fill('QA Mall Drawer');
  await page.getByTestId('mall-address').fill('123 QA Road, Pathum Wan, Bangkok');
  await page.getByTestId('mall-district').fill('Pathum Wan');

  await page.getByTestId('submit-mall').click();

  // Toast success
  await expect(page.getByText(/สำเร็จ|สร้างห้างสำเร็จ/i)).toBeVisible();
  // Drawer ปิด + ตารางรีเฟรช
  await expect(page.getByTestId('mall-form')).toBeHidden({ timeout: 5000 });
  await expect(page.locator('[data-testid="mall-row"]', { hasText: 'QA Mall Drawer' })).toBeVisible();
});
