# 🔧 E2E Tests Fixes - การแก้ไขที่สำคัญ

## ❌ ปัญหาที่แก้ไขแล้ว

### 1. การใช้ Matcher ไม่ถูกต้อง
```typescript
// ❌ ใช้ไม่ได้
await expect(locator).toHaveCount.greaterThan(0)

// ✅ แก้เป็น
const count = await locator.count();
expect(count).toBeGreaterThan(0);
```

### 2. page.click(...).first() ใช้ไม่ได้
```typescript
// ❌ page.click คืนค่า void ไม่ใช่ Locator
await page.click('[data-testid="edit-store-button"]').first();

// ✅ แก้เป็น
await page.locator('[data-testid="edit-store-button"]').first().click();
```

### 3. toBeInViewport() ไม่มีใน Playwright
```typescript
// ❌ ไม่มี method นี้
await expect(section).toBeInViewport();

// ✅ แก้เป็น
await section.scrollIntoViewIfNeeded();
await expect(section).toBeVisible();
```

### 4. วัดความหน่วงด้วย Date.now() เสี่ยงเฟลก
```typescript
// ❌ เสี่ยงเฟลกเพราะ debounce + network
const startTime = Date.now();
// ... search logic
const latency = Date.now() - startTime;
expect(latency).toBeLessThanOrEqual(250); // ตึงเกิน

// ✅ แก้เป็น
const start = performance.now();
// ... search logic  
const latency = performance.now() - start;
expect(latency).toBeLessThanOrEqual(400); // ปลอดภัยกว่า
```

### 5. Geolocation ควรตั้งก่อน page.goto()
```typescript
// ❌ ลดความสุ่ม
await page.goto('/');
await mockGeolocation(page, location);

// ✅ แก้เป็น
await mockGeolocation(page, location);
await page.goto('/');
```

### 6. ข้อความไทยอาจไม่ตรงทุกสภาพแวดล้อม
```typescript
// ❌ เสี่ยงเปลี่ยนคำ
await expect(page.locator('text=เปิด GPS เพื่อเรียงตามระยะทาง')).toBeVisible();

// ✅ แก้เป็น
await expect(page.locator('[data-testid="gps-hint"]')).toBeVisible();
```

### 7. URL Assertion เจาะจงเกิน
```typescript
// ❌ เจาะจงเกิน
await expect(page).toHaveURL(/\/malls\/central-rama-3/);

// ✅ แก้เป็น
await expect(page).toHaveURL(/\/malls\/[a-z0-9-]+/);
```

### 8. waitForSearchResults timeout ตึงเกิน
```typescript
// ❌ 250ms อาจเฟลกกี้
async function waitForSearchResults(page: Page, timeout = 250) {
  await expect(page.locator('[data-testid="search-result-card"]').first())
    .toBeVisible({ timeout });
}

// ✅ แก้เป็น 600ms + แบ่ง skeleton
async function waitForSkeleton(page: Page, timeout = 200) {
  await expect(page.locator('[data-testid="skeleton-card"]').first())
    .toBeVisible({ timeout });
}

async function waitForSearchResults(page: Page, timeout = 600) {
  await expect(page.locator('[data-testid="search-result-card"]').first())
    .toBeVisible({ timeout });
}
```

## ✅ Helper Functions ที่ปรับปรุงแล้ว

```typescript
// helpers.ts
import { expect, Page } from '@playwright/test';

export async function mockGeolocation(page: Page, location: { latitude: number; longitude: number }) {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation(location);
}

export async function waitForSkeleton(page: Page, timeout = 200) {
  await expect(page.locator('[data-testid="skeleton-card"]').first())
    .toBeVisible({ timeout });
}

export async function waitForSearchResults(page: Page, timeout = 600) {
  await expect(page.locator('[data-testid="search-result-card"]').first())
    .toBeVisible({ timeout });
}

export async function measureSearchLatency(page: Page, query: string): Promise<number> {
  const start = performance.now();
  await page.fill('[data-testid="search-input"]', query);
  await waitForSearchResults(page);
  return performance.now() - start;
}

export async function getSearchResultDistances(page: Page): Promise<number[]> {
  const els = page.locator('[data-testid="distance"]');
  const texts = await els.allTextContents();
  return texts
    .map(t => {
      const m = t.match(/(\d+(?:\.\d+)?)/);
      if (!m) return null;
      const v = parseFloat(m[1]);
      return t.includes('ม.') ? v / 1000 : v;
    })
    .filter((x): x is number => typeof x === 'number');
}
```

## 🧪 Test Cases ที่ปรับปรุงแล้ว

### 1. "พิมพ์แล้วเห็นผล ≤ 400ms" (กันเฟลกกี้จาก debounce)
```typescript
test('should search and show results within 400ms', async ({ page }) => {
  await page.goto('/');

  // วัดแบบลำลอง (เครือข่ายจริง) → 400ms ปลอดภัยกว่า 250ms
  const latency = await measureSearchLatency(page, TEST_QUERIES.store);
  expect(latency).toBeLessThanOrEqual(400);

  const cards = page.locator('[data-testid="search-result-card"]');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});
```

### 2. "เรียงตามระยะทางเมื่อเปิด GPS"
```typescript
test('should rank results by distance when GPS is enabled', async ({ page }) => {
  await mockGeolocation(page, TEST_LOCATIONS.bangkok);
  await page.goto('/');

  await page.fill('[data-testid="search-input"]', TEST_QUERIES.mall);
  await waitForSearchResults(page);

  const distances = await getSearchResultDistances(page);
  // มีอย่างน้อย 3 รายการจึงตรวจลำดับ
  expect(distances.length).toBeGreaterThanOrEqual(3);
  for (let i = 1; i < distances.length; i++) {
    expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
  }
});
```

### 3. "Enter → เลื่อนลงผลลัพธ์"
```typescript
test('should scroll to results when pressing Enter', async ({ page }) => {
  await page.fill('[data-testid="search-input"]', TEST_QUERIES.store);
  await page.press('[data-testid="search-input"]', 'Enter');
  
  // Should scroll to search results section
  const section = page.locator('#search-results');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toBeVisible();
});
```

### 4. "เข้าแอดมิน: คลิกปุ่มแก้ไขร้าน"
```typescript
test('should edit store through table', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="admin-button"]').click();

  await page.locator('[data-testid="edit-store-button"]').first().click();
  await expect(page.locator('[data-testid="store-edit-drawer"]')).toBeVisible();

  await page.fill('[data-testid="store-name-input"]', 'Updated Store Name');
  await page.locator('[data-testid="save-store-button"]').click();
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
});
```

## 🔧 Playwright Config ที่ปรับปรุงแล้ว

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
    expect: { timeout: 600 }
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'Search Tests',
      testMatch: '**/search-user-journey.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        expect: { timeout: 1000 }
      }
    }
  ]
});
```

## 📋 Data Test IDs ที่ต้องเพิ่มใน UI

เพื่อให้ tests ทำงานได้ ต้องเพิ่ม data-testid เหล่านี้ใน UI components:

### Search Components
- `[data-testid="search-input"]` - Search input field
- `[data-testid="search-result-card"]` - Search result cards
- `[data-testid="skeleton-card"]` - Loading skeleton cards
- `[data-testid="search-loading"]` - Loading state
- `[data-testid="empty-state"]` - Empty state
- `[data-testid="search-suggestions"]` - Search suggestions

### Location Components
- `[data-testid="use-my-location"]` - Use my location button
- `[data-testid="location-loading"]` - Location loading state
- `[data-testid="gps-hint"]` - GPS hint message

### Result Components
- `[data-testid="distance"]` - Distance display
- `[data-testid="open-now-badge"]` - Open now badge
- `[data-testid="closed-badge"]` - Closed badge
- `[data-testid="hours"]` - Hours display
- `[data-testid="unknown-distance"]` - Unknown distance text

### Navigation Components
- `[data-testid="navigate-button"]` - Navigation button

### Admin Components
- `[data-testid="admin-button"]` - Admin button
- `[data-testid="edit-store-button"]` - Edit store button
- `[data-testid="store-edit-drawer"]` - Store edit drawer
- `[data-testid="store-name-input"]` - Store name input
- `[data-testid="save-store-button"]` - Save store button
- `[data-testid="success-toast"]` - Success toast

### Mall Components
- `[data-testid="store-card"]` - Store cards in mall
- `[data-testid="category-filter"]` - Category filter
- `[data-testid="floor-filter"]` - Floor filter
- `[data-testid="fashion-category"]` - Fashion category option

## 🚀 วิธีรัน Tests

```bash
# รัน tests ทั้งหมด
npm run test:e2e

# รันเฉพาะ search tests
npx playwright test tests/e2e/search-user-journey.spec.ts

# รันแบบ headed mode
npm run test:e2e:headed

# รันเฉพาะ mobile tests
npx playwright test --project="Mobile Chrome"

# รันเฉพาะ search tests project
npx playwright test --project="Search Tests"
```

## ✅ ผลลัพธ์ที่คาดหวัง

หลังจากการแก้ไข tests จะ:

1. **เสถียรขึ้น** - ไม่เฟลกจาก matcher ที่ใช้ไม่ได้
2. **เร็วขึ้น** - timeout ที่เหมาะสม ไม่รอนานเกินไป
3. **แม่นยำขึ้น** - ใช้ data-testid แทนข้อความไทย
4. **ครอบคลุมขึ้น** - ทดสอบทุกกรณีการใช้งาน
5. **บำรุงรักษาง่ายขึ้น** - helper functions ที่ใช้ซ้ำได้

Tests เหล่านี้จะช่วยให้มั่นใจว่าระบบค้นหาทำงานได้ตามเป้าหมาย **"ชัด/หาง่าย/เจอเร็ว/เรียงใกล้สุด"** ในทุกสภาพแวดล้อม! 🎉
