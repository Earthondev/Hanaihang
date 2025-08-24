import { test, expect } from '@playwright/test';

test.describe('Double Submit Prevention', () => {
  test('prevent double submit on mall create', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    await page.getByRole('button', { name: /สร้างห้าง/i }).click();
    await page.getByLabel(/ชื่อห้างสรรพสินค้า/i).fill('QA Mall ' + Date.now());

    const submit = page.getByRole('button', { name: /เพิ่มห้าง|กำลังบันทึก/i });
    await submit.click();
    await submit.click({ trial: true }); // กดย้ำแบบ trial

    await expect(submit).toBeDisabled();
    await expect(page.getByText(/สำเร็จ|บันทึกสำเร็จ/i)).toBeVisible({ timeout: 5000 });
  });

  test('prevent double submit on store create', async ({ page }) => {
    await page.goto('/admin?tab=stores');
    await page.getByRole('button', { name: /เพิ่มร้านค้าใหม่/i }).click();
    
    // กรอกข้อมูลร้านค้า
    await page.getByLabel(/ชื่อร้านค้า/i).fill('QA Store ' + Date.now());
    await page.selectOption('select[name="category"]', 'Fashion');
    await page.selectOption('select[name="mallId"]', '1'); // เลือกห้างแรก
    await page.selectOption('select[name="floorId"]', 'G'); // เลือกชั้น G
    await page.getByLabel(/ยูนิต/i).fill('QA-001');

    const submit = page.getByRole('button', { name: /เพิ่มร้านค้า|กำลังบันทึก/i });
    await submit.click();
    await submit.click({ trial: true }); // กดย้ำแบบ trial

    await expect(submit).toBeDisabled();
    await expect(page.getByText(/สำเร็จ|บันทึกสำเร็จ/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows toast on create success', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    await page.getByRole('button', { name: /สร้างห้าง/i }).click();
    await page.getByLabel(/ชื่อห้างสรรพสินค้า/i).fill('Toast Test Mall ' + Date.now());
    await page.getByRole('button', { name: /เพิ่มห้าง/i }).click();
    
    await expect(page.getByText(/สำเร็จ/i)).toBeVisible({ timeout: 5000 });
  });

  test('form has aria-busy while submitting', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    await page.getByRole('button', { name: /สร้างห้าง/i }).click();
    
    const form = page.locator('form').first();
    await page.getByRole('button', { name: /เพิ่มห้าง/i }).click();
    await expect(form).toHaveAttribute('aria-busy', 'true');
  });

  test('delete button prevents double click', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    
    // หาปุ่มลบแรก
    const deleteButton = page.locator('[aria-label*="ลบ"]').first();
    await deleteButton.click();
    
    // ยืนยันการลบ
    await page.getByRole('button', { name: /ยืนยัน|ตกลง/i }).click();
    
    // ตรวจสอบว่าปุ่มถูก disable
    await expect(deleteButton).toBeDisabled();
  });

  test('cancel button is disabled during submit', async ({ page }) => {
    await page.goto('/admin?tab=malls');
    await page.getByRole('button', { name: /สร้างห้าง/i }).click();
    
    const cancelButton = page.getByRole('button', { name: /ยกเลิก/i });
    const submitButton = page.getByRole('button', { name: /เพิ่มห้าง/i });
    
    await submitButton.click();
    
    // ตรวจสอบว่าปุ่มยกเลิกถูก disable
    await expect(cancelButton).toBeDisabled();
  });
});
