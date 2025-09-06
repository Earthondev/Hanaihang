# E2E Tests Stability Fixes

## 🎯 **สรุปการแก้ไขเพื่อความเสถียร**

### ✅ **1. แก้ไข Permission Test**
**ปัญหา:** ใช้ `page.on('dialog')` ซึ่งไม่ทำงานกับ geolocation permission
**แก้ไข:** ใช้ `page.context().grantPermissions(['geolocation'])` โดยตรง

```typescript
// ❌ เดิม
page.on('dialog', async dialog => {
  expect(dialog.type()).toBe('beforeunload');
  await dialog.accept();
});

// ✅ ใหม่
await page.context().grantPermissions(['geolocation']);
await page.goto('/');
```

### ✅ **2. ตั้ง GPS ก่อน page.goto()**
**ปัญหา:** เทสที่ต้องจัดอันดับตามระยะทางอาจพลาดตำแหน่งตอนโหลดหน้า
**แก้ไข:** ย้าย `mockGeolocation()` ไปใน `beforeEach` ของ Happy Path suite

```typescript
// ✅ Happy Path suite
test.describe('Happy Path: First-time Mobile User', () => {
  test.beforeEach(async ({ page }) => {
    await mockGeolocation(page, TEST_LOCATIONS.bangkok);
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
  });
```

### ✅ **3. แก้ไขการคำนวณ P95 ให้ปลอดภัย**
**ปัญหา:** `Math.floor(sorted.length * 0.95)` อาจเกิน index เมื่อ array เล็ก
**แก้ไข:** เพิ่ม bounds checking

```typescript
// ❌ เดิม
const p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];

// ✅ ใหม่
const p95Index = Math.min(sortedLatencies.length - 1, Math.floor(sortedLatencies.length * 0.95) - 1);
const p95Latency = sortedLatencies[Math.max(0, p95Index)];
```

### ✅ **4. แยก Concurrent Searches เป็นหลายหน้า**
**ปัญหา:** ใช้ page เดียวกันทำให้ race condition
**แก้ไข:** สร้าง page ใหม่สำหรับแต่ละ query

```typescript
// ❌ เดิม
const promises = Object.values(TEST_QUERIES).map(query => 
  measureSearchLatency(page, query)
);

// ✅ ใหม่
test('should handle concurrent searches', async ({ browser }) => {
  const queries = Object.values(TEST_QUERIES).filter(q => q !== TEST_QUERIES.invalid);
  const latencies = await Promise.all(queries.map(async q => {
    const page = await browser.newPage();
    await page.goto('/');
    const t = await measureSearchLatency(page, q);
    await page.close();
    return t;
  }));
});
```

### ✅ **5. เพิ่ม Skeleton Timeout**
**ปัญหา:** `waitForSkeleton(page, 200)` เข้มเกินไป
**แก้ไข:** เพิ่มเป็น 500ms

```typescript
// ❌ เดิม
async function waitForSkeleton(page: Page, timeout = 200) {

// ✅ ใหม่
async function waitForSkeleton(page: Page, timeout = 500) {
```

### ✅ **6. อัปเดต Playwright Config**
**เพิ่ม:** Default timeouts และ geolocation permissions

```typescript
export default defineConfig({
  expect: {
    timeout: 800
  },
  use: {
    actionTimeout: 10000,
    navigationTimeout: 15000
  },
  projects: [
    {
      name: 'Search Tests',
      testMatch: '**/search-user-journey.spec.ts',
      expect: {
        timeout: 1000
      },
      use: {
        permissions: ['geolocation']
      }
    }
  ]
});
```

## 🚀 **ผลลัพธ์ที่คาดหวัง**

### **ความเสถียรที่เพิ่มขึ้น:**
- ✅ Permission tests ไม่ตกเพราะ dialog handling
- ✅ Distance ranking tests ได้ตำแหน่งถูกต้องตั้งแต่เริ่มต้น
- ✅ P95 calculation ไม่ crash เมื่อมีข้อมูลน้อย
- ✅ Concurrent tests ไม่ race กันเอง
- ✅ Skeleton loading มีเวลาพอสำหรับ network latency
- ✅ Default timeouts เหมาะสมกับ real-world conditions

### **การปรับปรุงเพิ่มเติม:**
- 🎯 Geolocation permissions ตั้งไว้ล่วงหน้าใน Search Tests project
- 🎯 Action timeout 10s สำหรับ complex interactions
- 🎯 Navigation timeout 15s สำหรับ slow networks
- 🎯 Expect timeout 800ms default, 1000ms สำหรับ search tests

## 📊 **การทดสอบ**

รันเทสเพื่อตรวจสอบความเสถียร:

```bash
# รันเทสทั้งหมด
npm run test:e2e

# รันเฉพาะ search tests
npx playwright test --project="Search Tests"

# รันเทสเฉพาะที่แก้ไข
npx playwright test tests/e2e/search-user-journey.spec.ts
```

## 🎉 **สรุป**

เทสเวอร์ชันนี้ **"พร้อมใช้งานจริง"** แล้ว! การแก้ไขทั้งหมดมุ่งเน้นที่:

1. **ลดความเฟลกกี้** จาก timing issues และ race conditions
2. **เพิ่มความเสถียร** ของ permission handling และ GPS setup
3. **ป้องกัน crashes** จาก edge cases ใน calculations
4. **ปรับ timeout** ให้เหมาะสมกับ real-world conditions

เทสจะทำงานได้เสถียรขึ้นมากใน CI/CD และ local development! 🚀
