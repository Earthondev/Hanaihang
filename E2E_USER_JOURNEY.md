# 🎯 E2E User Journey - HaaNaiHang Search System

## 📋 ภาพรวม E2E ของผู้ใช้ (End-to-End User Journey)

ระบบค้นหาที่ครอบคลุมทุกกรณีการใช้งาน ตั้งแต่เข้าหน้าแรก → ค้นหา → ดูรายละเอียด → นำทาง พร้อมกรณีขอบ/ทางเลือก และเมตริกที่ควรติดตาม

---

## 🚀 1. Happy Path: ผู้ใช้ทั่วไปครั้งแรก (มือถือ)

### เป้าหมาย
หา **"ห้าง/ร้านที่ใกล้ที่สุดและเปิดอยู่ตอนนี้"** ให้เร็วที่สุด

### User Journey

#### 1.1 เปิดเว็บ
- **ระบบโหลด**: Hero + Search และถามสิทธิ์ "ใช้ตำแหน่งของฉัน"
- ✅ **คาดหวัง**: ถ้าอนุญาต ตำแหน่งผู้ใช้ถูกเซ็ตใน state
- **เมตริก**: `page_load_time`, `gps_permission_requested`

#### 1.2 เริ่มพิมพ์คำค้น (เช่น "H&M")
- **Debounce**: ~120ms → ยิงค้นหา malls + stores พร้อมกัน
- **แสดงผล**: "การ์ดผลลัพธ์" ใต้ Hero แบบเรียลไทม์
- ✅ **คาดหวัง**: การ์ดขึ้นภายใน ≤250ms (cache/partial) และ ≤600ms (ผลเต็ม)
- **เมตริก**: `search_latency_ms`, `from_cache`, `results_count`

#### 1.3 เรียงผลลัพธ์ตาม "ระยะทาง"
- **คำนวณระยะ**: Web Worker จากพิกัดผู้ใช้
- **ใกล้สุด**: ติด badge 1–3 อันดับ
- ✅ **คาดหวัง**: ลำดับใกล้ → ไกล เสถียร, ไม่กระตุก
- **เมตริก**: `distance_calculation_time`, `ranking_accuracy`

#### 1.4 กรอง "เปิดอยู่ตอนนี้" (toggle)
- **ซ่อนร้าน/ห้าง**: ที่ปิด, อัปเดตลิสต์ทันที
- ✅ **คาดหวัง**: การ์ดแสดง "เวลาเปิด-ปิดวันนี้" และสถานะ
- **เมตริก**: `filter_usage_rate`, `open_now_filter_applied`

#### 1.5 แตะการ์ดรายการอันดับแรก
- **ไปหน้า**: รายละเอียด (Store/Mall Detail)
- ✅ **คาดหวัง**: เห็นชื่อ, ชั้น, เวลาเปิด-ปิด, ระยะทาง, ปุ่ม "นำทาง"
- **เมตริก**: `click_through_rate`, `result_rank_clicked`

#### 1.6 แตะ "นำทาง"
- **เปิดแผนที่**: Google/Apple Maps ด้วยพิกัดปลายทาง
- ✅ **คาดหวัง**: แผนที่เปิดด้วยจุดหมายถูกต้อง
- **เมตริก**: `navigation_success_rate`, `maps_app_opened`

---

## 🔄 2. Alternative Path A: ผู้ใช้ไม่อนุญาตตำแหน่ง

### 2.1 ปฏิเสธ GPS
- **ระบบยังให้ค้นหาได้**: เรียงผล fallback (เช่น ความเกี่ยวข้อง/ชื่อ)
- **แนะนำ**: "เปิด GPS เพื่อเรียงตามระยะทาง"
- ✅ **คาดหวัง**: ไม่มี error, แสดงผลปกติ
- **เมตริก**: `gps_denied_rate`, `fallback_ranking_used`

### 2.2 กด "ใช้ตำแหน่งของฉัน" อีกครั้ง
- **ขอสิทธิ์ใหม่**: → re-rank ผลทันที
- ✅ **คาดหวัง**: ผลลัพธ์อัปเดตตามระยะทางใหม่
- **เมตริก**: `gps_retry_rate`, `re_ranking_success`

---

## 🏢 3. Alternative Path B: ผู้ใช้ค้นหาห้างก่อนแล้วค่อยกรองร้าน

### 3.1 ค้นหา "CentralWorld"
- **เข้าหน้าห้าง**: ดูร้านทั้งหมดในห้าง
- ✅ **คาดหวัง**: แสดงร้านทั้งหมดพร้อม filter options

### 3.2 กรองตามหมวด/ชั้น ("แฟชั่น, ชั้น 2")
- **Filter**: ตามหมวด/ชั้น
- ✅ **คาดหวัง**: ร้านถูกกรองทันที
- **เมตริก**: `mall_detail_filter_usage`

### 3.3 แตะร้าน → รายละเอียดร้าน → นำทาง
- **Navigation**: จากร้านในห้าง
- ✅ **คาดหวัง**: ข้อมูลครบถ้วน, นำทางถูกต้อง
- **เมตริก**: `mall_to_store_navigation_rate`

---

## ⚠️ 4. Edge Cases

### 4.1 ไม่มีผลลัพธ์
- **Empty State**: "ไม่พบผลลัพธ์สำหรับ '{q}'" + คำแนะนำ/สะกด
- ✅ **คาดหวัง**: แสดงคำแนะนำการค้นหา
- **เมตริก**: `empty_search_rate`, `suggestions_shown`

### 4.2 เน็ตช้า
- **Skeleton**: 6–9 ใบใน grid, ไม่กระโดดเลย์เอาต์
- ✅ **คาดหวัง**: Loading state ที่เสถียร
- **เมตริก**: `slow_network_handling`, `layout_shift_score`

### 4.3 ตำแหน่งคลาดเคลื่อน
- **ปุ่มรีเฟรช**: "รีเฟรชตำแหน่ง"
- ✅ **คาดหวัง**: อัปเดตตำแหน่งใหม่
- **เมตริก**: `location_refresh_rate`, `location_accuracy`

### 4.4 ร้านไม่มีพิกัด
- **ใช้ mallCoords**: คำนวณระยะ (เดนอร์มัลไลซ์ไว้แล้ว)
- ✅ **คาดหวัง**: แสดงระยะทางจากห้าง
- **เมตริก**: `fallback_coordinates_used`

---

## 🔄 5. ผู้ใช้ขาประจำ (Returning)

### 5.1 กล่องค้นหาจำ "คำล่าสุด"
- **Local Storage**: คำล่าสุด + แคชผล 2 นาที
- **Stale-while-revalidate**: ผลครั้งก่อนโชว์ทันที → ตามด้วยผลสดอัปเดต
- ✅ **คาดหวัง**: ประสบการณ์เร็วขึ้น
- **เมตริก**: `returning_user_rate`, `cache_hit_rate`

### 5.2 เปิดเว็บ → ผลครั้งก่อนโชว์ทันที
- **Instant Results**: จาก cache
- **Background Update**: ผลสดอัปเดต/เรียงใหม่เมื่อได้ GPS
- ✅ **คาดหวัง**: TTI ≤ 100ms สำหรับ returning users
- **เมตริก**: `instant_results_rate`, `background_update_success`

---

## 👨‍💼 6. แอดมิน/ผู้ดูแล (แยกโหมด)

### 6.1 กดไอคอนตั้งค่าใน Header
- **Admin Panel**: เพิ่ม/แก้ "ห้าง/ร้าน" ผ่าน Drawer
- ✅ **คาดหวัง**: UI แยกจาก user mode

### 6.2 ฟอร์มมี RHF + Zod
- **Safe Submit**: toast, a11y
- ✅ **คาดหวัง**: Validation ครบถ้วน
- **เมตริก**: `admin_form_submission_rate`, `validation_error_rate`

### 6.3 ตารางมี search/filter/sort/pagination
- **CRUD Operations**: + ลบแบบยืนยัน
- ✅ **คาดหวัง**: การจัดการข้อมูลเสถียร
- **เมตริก**: `admin_crud_success_rate`

---

## ✅ เกณฑ์ "ความสำเร็จของ UX ค้นหา" (รับงานได้)

### Performance Requirements
- ✅ **พิมพ์ตัวแรก**: การ์ดผลลัพธ์โผล่ใต้ Hero ภายใน ≤250ms
- ✅ **Enter**: scroll ไปยัง "ผลการค้นหา" ทันที
- ✅ **ผลรวม**: "ห้าง + ร้าน" ในลิสต์เดียว เรียงตามระยะทาง (เมื่อมี GPS)
- ✅ **Toggle**: "เปิดอยู่ตอนนี้" ทำงานไว ไม่มีค้าง

### UI/UX Requirements
- ✅ **การ์ดแต่ละใบ**: แสดงระยะทาง, สถานะเปิด/ปิด, เวลา, (ถ้าเป็นร้าน) ชื่อห้าง + ชั้น
- ✅ **ไม่มี dropdown**: เกะกะ, keyboard-friendly, screen reader อ่านจำนวนผล (aria-live="polite")

---

## 🧪 สคริปต์ทดสอบ E2E (สิ่งที่ควรครอบ)

### Core Test Cases
```javascript
// 1. Search Performance
test('search-type-first', async ({ page }) => {
  await page.fill('[data-testid="search-input"]', 'h&m');
  await expect(page.locator('[data-testid="search-result-card"]'))
    .toBeVisible({ timeout: 250 });
});

// 2. Navigation
test('enter-scroll', async ({ page }) => {
  await page.fill('[data-testid="search-input"]', 'central');
  await page.press('[data-testid="search-input"]', 'Enter');
  await expect(page.locator('#search-results')).toBeInViewport();
});

// 3. Distance Ranking
test('distance-ranking', async ({ page }) => {
  await page.context().setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
  await page.fill('[data-testid="search-input"]', 'mall');
  const distances = await page.locator('[data-testid="distance"]').allTextContents();
  // Verify distances are sorted ascending
});

// 4. Filter Functionality
test('open-now-filter', async ({ page }) => {
  await page.fill('[data-testid="search-input"]', 'store');
  await page.click('[data-testid="open-now-toggle"]');
  await expect(page.locator('[data-testid="closed-badge"]')).toHaveCount(0);
});

// 5. Navigation Integration
test('detail-to-navigate', async ({ page }) => {
  await page.fill('[data-testid="search-input"]', 'central');
  await page.locator('[data-testid="search-result-card"]').first().click();
  await page.click('[data-testid="navigate-button"]');
  const href = await page.locator('[data-testid="navigate-button"]').getAttribute('href');
  expect(href).toMatch(/maps\.google\.com|maps\.apple\.com/);
});

// 6. No GPS Fallback
test('no-gps-fallback', async ({ page }) => {
  await page.context().clearPermissions();
  await page.fill('[data-testid="search-input"]', 'store');
  await expect(page.locator('[data-testid="search-result-card"]')).toHaveCount.greaterThan(0);
});

// 7. Empty State
test('empty-state', async ({ page }) => {
  await page.fill('[data-testid="search-input"]', 'xyz123nonexistent');
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
});

// 8. Request Abortion
test('perf-abort', async ({ page }) => {
  await page.fill('[data-testid="search-input"]', 'c');
  await page.fill('[data-testid="search-input"]', 'ce');
  await page.fill('[data-testid="search-input"]', 'central');
  // Should only show results for final query
});
```

---

## 📊 เมตริกที่ควรติดตาม (เพื่อคุม "หาง่าย เจอเร็ว")

### Core Performance Metrics
- **`search_latency_ms`** (median / p95): เป้าหมาย ≤400ms / ≤600ms
- **`search_results_count`** ต่อ query: วัดความครอบคลุมข้อมูล
- **`from_cache`** อัตราใช้แคช: เป้าหมาย ≥60%
- **`gps_allowed_rate`** อัตราอนุญาตตำแหน่ง: เป้าหมาย ≥30%

### User Behavior Metrics
- **`click_through_rate`** ต่ออันดับ (1–3 ควรสูง): วัดความเกี่ยวข้อง
- **`empty_rate`** อัตราไม่พบผล: ใช้ชี้ว่า data coverage ต้องเพิ่ม
- **`filter_usage_rate`**: วัดการใช้งานฟีเจอร์กรอง
- **`navigation_success_rate`**: วัดความสำเร็จการนำทาง

### Technical Metrics
- **`cache_hit_rate`**: ประสิทธิภาพ cache system
- **`distance_calculation_time`**: เวลาคำนวณระยะทาง
- **`ranking_accuracy`**: ความแม่นยำการเรียงลำดับ
- **`layout_shift_score`**: เสถียรภาพ UI

---

## 🎯 ผลลัพธ์ที่คาดหวัง

### Performance Targets
- **TTI**: ≤250ms (cache/partial results)
- **Full Results**: ≤600ms (network requests)
- **SLA Compliance**: ≥95% (median latency ≤400ms)
- **Cache Hit Rate**: ≥60%
- **Empty Search Rate**: ≤15%

### User Experience Targets
- **Click-Through Rate**: Rank 1-3 ≥10%
- **GPS Permission Rate**: ≥30%
- **Navigation Success Rate**: ≥95%
- **Filter Usage Rate**: ≥20%

### Technical Targets
- **Layout Shift Score**: ≤0.1
- **Distance Calculation**: ≤50ms
- **Ranking Accuracy**: ≥90%
- **Error Rate**: ≤1%

---

## 🚀 การใช้งาน

### รัน E2E Tests
```bash
# รัน tests ทั้งหมด
npm run test:e2e

# รันเฉพาะ search tests
npx playwright test tests/e2e/search-user-journey.spec.ts

# รันแบบ headed mode
npm run test:e2e:headed
```

### ดู Analytics Dashboard
```bash
# เข้า Admin Panel
http://localhost:3000/admin

# ดู Search Analytics
http://localhost:3000/admin/search-analytics
```

### Export Performance Data
```javascript
// ใน browser console
const analytics = window.searchAnalytics;
const data = analytics.exportData();
console.log(data);
```

---

## 📈 การติดตามและปรับปรุง

### Daily Monitoring
- ตรวจสอบ SLA compliance rate
- ติดตาม empty search rate
- วิเคราะห์ click-through patterns

### Weekly Analysis
- Review performance trends
- Identify optimization opportunities
- Update search suggestions

### Monthly Review
- Comprehensive performance report
- User behavior analysis
- Feature usage statistics

ระบบนี้จะทำให้ผู้ใช้สามารถค้นหาห้างและร้านค้าได้อย่างรวดเร็วและแม่นยำ ตามเป้าหมาย **"ชัด/หาง่าย/เจอเร็ว/เรียงใกล้สุด"** ที่กำหนดไว้ พร้อมการติดตามเมตริกที่ครอบคลุมทุกมิติของ User Journey! 🎉
