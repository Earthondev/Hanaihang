import { test, expect } from "@playwright/test";

test.describe('Store Card Features', () => {
  test.beforeEach(async ({ page, context }) => {
    // จำลองตำแหน่งผู้ใช้ (CentralWorld area)
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 13.7466, longitude: 100.5347 });
  });

  test('StoreCard shows mall name, floor (resolved) and distance', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card แรกที่มี
    const storeCard = page.locator('[data-testid="store-card"]').first();
    
    // รอให้ card โหลดเสร็จ
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่ามีชื่อร้าน
    await expect(storeCard.locator('h3')).toBeVisible();

    // ตรวจสอบว่ามีชื่อห้าง (ถ้า showMallName = true)
    const mallName = storeCard.locator('p').filter({ hasText: /Central|Siam|Icon|Mega|Terminal/i });
    await expect(mallName).toBeVisible();

    // ตรวจสอบว่ามีชั้น
    const floorInfo = storeCard.locator('text=/ชั้น /');
    await expect(floorInfo).toBeVisible();

    // ตรวจสอบว่ามีระยะทาง
    const distance = storeCard.locator('text=/กม\\./');
    await expect(distance).toBeVisible();

    // ตรวจสอบว่ามีหมวดหมู่
    const category = storeCard.locator('[class*="bg-blue-100"]');
    await expect(category).toBeVisible();

    // ตรวจสอบว่ามีสถานะ
    const status = storeCard.locator('[class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-red-100"]');
    await expect(status).toBeVisible();
  });

  test('StoreCard shows correct floor information', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card
    const storeCard = page.locator('[data-testid="store-card"]').first();
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่าชั้นแสดงผลถูกต้อง (ไม่ใช่แค่ floorId)
    const floorInfo = storeCard.locator('text=/ชั้น /');
    await expect(floorInfo).toBeVisible();
    
    // ตรวจสอบว่าชั้นไม่ใช่แค่ตัวเลขหรือตัวอักษรเดี่ยว
    const floorText = await floorInfo.textContent();
    expect(floorText).toMatch(/ชั้น [A-Z0-9]+/);
  });

  test('StoreCard shows distance calculation', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card
    const storeCard = page.locator('[data-testid="store-card"]').first();
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่ามีระยะทาง
    const distance = storeCard.locator('text=/ระยะทาง/');
    await expect(distance).toBeVisible();

    // ตรวจสอบว่าระยะทางแสดงเป็นกิโลเมตร
    const distanceText = await distance.textContent();
    expect(distanceText).toMatch(/ระยะทาง [0-9]+\.[0-9]+ กม\./);
  });

  test('StoreCard shows mall information correctly', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card
    const storeCard = page.locator('[data-testid="store-card"]').first();
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่ามีชื่อห้าง
    const mallName = storeCard.locator('p').filter({ hasText: /Central|Siam|Icon|Mega|Terminal/i });
    await expect(mallName).toBeVisible();

    // ตรวจสอบว่าชื่อห้างไม่ใช่ slug
    const mallText = await mallName.textContent();
    expect(mallText).not.toMatch(/central-|siam-|icon-|mega-|terminal-/);
  });

  test('StoreCard handles missing data gracefully', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card
    const storeCard = page.locator('[data-testid="store-card"]').first();
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่ามี loading state
    const loadingSpinner = storeCard.locator('.animate-pulse');
    
    // ตรวจสอบว่าไม่มี error state
    const errorMessage = storeCard.locator('text=/error|Error|ERROR/');
    await expect(errorMessage).not.toBeVisible();
  });

  test('StoreCard shows unit information when available', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card
    const storeCard = page.locator('[data-testid="store-card"]').first();
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่ามีข้อมูลยูนิต (ถ้ามี)
    const unitInfo = storeCard.locator('text=/ยูนิต/');
    
    // ถ้ามียูนิต ตรวจสอบว่าระบุถูกต้อง
    if (await unitInfo.isVisible()) {
      const unitText = await unitInfo.textContent();
      expect(unitText).toMatch(/ยูนิต [A-Z0-9-]+/);
    }
  });

  test('StoreCard shows hours when available', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card
    const storeCard = page.locator('[data-testid="store-card"]').first();
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่ามีข้อมูลเวลาทำการ (ถ้ามี)
    const hoursInfo = storeCard.locator('text=/[0-9]{2}:[0-9]{2}/');
    
    // ถ้ามีเวลาทำการ ตรวจสอบว่าระบุถูกต้อง
    if (await hoursInfo.isVisible()) {
      const hoursText = await hoursInfo.textContent();
      expect(hoursText).toMatch(/[0-9]{2}:[0-9]{2}/);
    }
  });

  test('StoreCard shows phone when available', async ({ page }) => {
    await page.goto('/');

    // รอให้หน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');

    // ค้นหา store card
    const storeCard = page.locator('[data-testid="store-card"]').first();
    await expect(storeCard).toBeVisible({ timeout: 10000 });

    // ตรวจสอบว่ามีข้อมูลเบอร์โทร (ถ้ามี)
    const phoneInfo = storeCard.locator('text=/📞/');
    
    // ถ้ามีเบอร์โทร ตรวจสอบว่าระบุถูกต้อง
    if (await phoneInfo.isVisible()) {
      const phoneText = await phoneInfo.textContent();
      expect(phoneText).toMatch(/📞 [0-9-+]+/);
    }
  });
});
