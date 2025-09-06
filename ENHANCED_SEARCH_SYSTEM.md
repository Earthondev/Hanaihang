# 🚀 Enhanced Search System

ระบบค้นหาที่ปรับปรุงแล้วสำหรับ HaaNaiHang - เน้น **ชัด/หาง่าย/เจอเร็ว/เรียงใกล้สุด**

## 📊 เป้าหมายประสิทธิภาพ (SLA)

- **TTI คำค้นแรก**: ≤ 250ms (cache/ผลลัพธ์บางส่วน)
- **ผลลัพธ์เต็ม**: ≤ 600ms (เครือข่ายจริง)
- **รีเรนเดอร์ระหว่างพิมพ์**: ≤ 16ms/frame (ไม่กระตุก)
- **การเรียงลำดับ**: ระยะทาง → สถานะเปิด/ปิด

## 🏗️ สถาปัตยกรรมระบบ

### 1. ข้อมูล & ดัชนี (Data + Index)

#### ฟิลด์ที่เพิ่มใน Firestore:

**Malls Collection:**
```javascript
{
  displayName: "Central Rama 3",
  name_normalized: "central rama 3", // ใหม่
  coords: { lat: 13.6891, lng: 100.5441 }
}
```

**Stores Collection:**
```javascript
{
  name: "Zara",
  name_normalized: "zara", // ใหม่
  mallId: "central-rama-3",
  mallName: "Central Rama 3", // ใหม่
  mallCoords: { lat: 13.6891, lng: 100.5441 }, // ใหม่
  mallSlug: "central-rama-3", // ใหม่
  floorLabel: "ชั้น 2",
  openNow: true, // ใหม่
  category: "Fashion"
}
```

#### Firestore Indexes:
```json
{
  "indexes": [
    {
      "collectionGroup": "malls",
      "fields": [
        { "fieldPath": "name_normalized", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stores", 
      "fields": [
        { "fieldPath": "name_normalized", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stores",
      "fields": [
        { "fieldPath": "name_normalized", "order": "ASCENDING" },
        { "fieldPath": "openNow", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 2. กลยุทธ์ Query

#### ค้นหาแบบคู่ขนาน:
```javascript
// Parallel queries with abort control
const [malls, stores] = await Promise.all([
  searchMalls(normalizedQuery, signal),
  searchStores(normalizedQuery, signal)
]);
```

#### Cache System:
- **TTL**: 2 นาที
- **Stale-while-revalidate**: แสดง cache ก่อน แล้วอัปเดตผลสด
- **Debounce**: 120ms + AbortController

### 3. การเรียงผล (Ranking Algorithm)

```javascript
score = w1 * distance_km + w2 * (openNow ? 0 : 5) + w3 * (isMall ? 0.3 : 0)

// Weights:
// w1 = 1.0 (distance)
// w2 = 1.0 (open status) 
// w3 = 0.1 (type bonus)
```

## 🎨 UI/UX Design

### 1. Search Interface
- **EnhancedSearchBox**: Input พร้อมเคล็ดลับการค้นหา
- **UnifiedSearchResults**: แสดงผลแบบการ์ดใต้ฮีโร่
- **Real-time feedback**: Skeleton → ผลลัพธ์จริง

### 2. Search Result Cards
- **Unified format**: รองรับทั้งห้างและร้าน
- **Visual hierarchy**: ระยะทางเด่น, สถานะเปิด/ปิด
- **Smart badges**: "ใกล้สุด", "เปิดอยู่ตอนนี้", "อันดับ 1-3"
- **Highlight matching**: คำที่ตรงในชื่อ/แบรนด์

### 3. Loading States
- **Skeleton cards**: 6-9 ใบ, คงตำแหน่ง grid
- **Empty state**: คำแนะนำการค้นหา
- **Error handling**: ปุ่มลองใหม่ + metrics

## 🔧 การใช้งาน

### 1. ติดตั้งและตั้งค่า

```bash
# 1. เพิ่มข้อมูลที่จำเป็นใน Firestore
node scripts/enhance-search-data.mjs

# 2. Deploy Firestore indexes
firebase deploy --only firestore:indexes

# 3. ทดสอบประสิทธิภาพ
node scripts/test-search-performance.mjs
```

### 2. ใช้งานใน Component

```tsx
import EnhancedSearchBox from '@/components/search/EnhancedSearchBox';
import { useDebouncedSearch } from '@/lib/enhanced-search';

function HomePage() {
  const [userLocation, setUserLocation] = useState(null);
  
  return (
    <EnhancedSearchBox
      onResultClick={(result) => {
        if (result.kind === 'mall') {
          navigate(`/malls/${result.name}`);
        } else {
          navigate(`/stores/${result.id}`);
        }
      }}
      userLocation={userLocation}
      placeholder="ค้นหาห้างหรือแบรนด์..."
    />
  );
}
```

### 3. Custom Search Hook

```tsx
import { useDebouncedSearch } from '@/lib/enhanced-search';

function MyComponent() {
  const { results, loading, error } = useDebouncedSearch(
    query, 
    userLocation,
    120 // debounce delay
  );
  
  return (
    <UnifiedSearchResults
      results={results}
      query={query}
      loading={loading}
      error={error}
      onResultClick={handleResultClick}
    />
  );
}
```

## 📈 การติดตามและวิเคราะห์

### 1. Telemetry Events

```javascript
// Search query tracking
trackEvent('search_query', {
  q: query,
  len: query.length,
  latency_ms: latency,
  from_cache: fromCache,
  results: results.length,
  stale: isStale
});

// Search result clicks
trackEvent('search_click_result', {
  rank: resultRank,
  distance_km: distance,
  kind: result.kind
});

// Empty searches
trackEvent('search_empty', {
  q: query
});
```

### 2. Performance Metrics

- **Median latency**: เป้าหมาย ≤ 400ms
- **95th percentile**: เป้าหมาย ≤ 600ms
- **Cache hit rate**: เป้าหมาย ≥ 60%
- **Empty search rate**: เป้าหมาย ≤ 15%

## 🧪 การทดสอบ

### 1. E2E Tests (Playwright)

```javascript
// Test cases
test('type_first_cards_render', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="search-input"]', 'central');
  
  // Should show cards within 250ms
  await expect(page.locator('[data-testid="search-result-card"]'))
    .toBeVisible({ timeout: 250 });
});

test('sorted_by_distance', async ({ page }) => {
  // Mock geolocation
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 13.7563, longitude: 100.5018 });
  
  await page.fill('[data-testid="search-input"]', 'mall');
  
  const distances = await page.locator('[data-testid="distance"]').allTextContents();
  // Verify distances are sorted ascending
});
```

### 2. Performance Tests

```bash
# Run performance tests
node scripts/test-search-performance.mjs

# Expected output:
# ✅ SLA Compliance: 95%+ (≤600ms)
# ✅ Ranking accuracy: PASS
# ✅ Cache performance: Average < 200ms
```

## 🚀 การปรับปรุงในอนาคต

### 1. Phase 2 Features
- **Search suggestions**: Auto-complete based on popular queries
- **Search filters**: เปิดอยู่ตอนนี้, ประเภทร้าน, ช่วงราคา
- **Search analytics**: Dashboard สำหรับดู metrics
- **Voice search**: รองรับการค้นหาด้วยเสียง

### 2. Performance Optimizations
- **Service Worker**: Offline search capability
- **Incremental loading**: Load more results on scroll
- **Image optimization**: Lazy loading for result images
- **CDN integration**: Cache static search assets

### 3. Advanced Features
- **Machine learning**: Personalized search ranking
- **Geofencing**: Location-based search suggestions
- **Multi-language**: Support for English search
- **Search history**: Recent searches with quick access

## 📋 Checklist การส่งงาน

### Data Layer ✅
- [x] เพิ่ม `name_normalized` ให้ malls/stores
- [x] เพิ่ม `mallCoords` และ `floorLabel` ให้ทุก store
- [x] ตั้ง Index: malls(name_normalized), stores(name_normalized)

### API/Logic ✅
- [x] ค้นหา malls+stores พร้อมกัน (limit, debounce, abort)
- [x] Cache 2 นาที + stale-while-revalidate
- [x] Worker คำนวณระยะ + ranking formula
- [x] Thai normalization function

### UI ✅
- [x] ปิด dropdown เดิม, แสดงการ์ดใต้ฮีโร่
- [x] กด Enter → scroll to results
- [x] การ์ดโชว์ ระยะทาง/เปิดอยู่/ชั้น/เวลาปิด
- [x] Skeleton/Empty/Error states

### QA ✅
- [x] Performance testing script
- [x] E2E test cases defined
- [x] SLA compliance checking
- [x] Documentation complete

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากการปรับปรุงนี้ ระบบค้นหาจะ:

1. **เร็วขึ้น**: TTI ≤ 250ms, ผลลัพธ์เต็ม ≤ 600ms
2. **แม่นยำขึ้น**: เรียงตามระยะทางและสถานะเปิด
3. **ใช้งานง่ายขึ้น**: UI ชัดเจน, feedback ทันที
4. **เสถียรขึ้น**: Error handling, fallback mechanisms
5. **วัดผลได้**: Telemetry และ performance metrics

ระบบนี้จะทำให้ผู้ใช้สามารถค้นหาห้างและร้านค้าได้อย่างรวดเร็วและแม่นยำ ตามเป้าหมาย "ชัด/หาง่าย/เจอเร็ว/เรียงใกล้สุด" ที่กำหนดไว้
