# ระบบค้นหาห้างและร้านค้า - HaaNaiHang

## 🎯 ภาพรวม

ระบบค้นหาใหม่ที่ครอบคลุมทั้งห้างสรรพสินค้าและร้านค้า พร้อมการคำนวณระยะทางและเรียงลำดับตามความใกล้เคียง

## ✨ คุณสมบัติหลัก

### 🔍 การค้นหาแบบครอบคลุม
- **ค้นหาห้าง**: ตามชื่อห้าง, slug, keywords
- **ค้นหาร้าน**: ตามชื่อร้าน, แบรนด์, หมวดหมู่
- **ค้นหาแบบ Prefix**: รองรับการพิมพ์บางส่วน
- **ค้นหาแบบ Case-insensitive**: ไม่สนใจตัวพิมพ์ใหญ่-เล็ก

### 📍 การคำนวณระยะทาง
- **Haversine Formula**: คำนวณระยะทางที่แม่นยำ
- **เรียงลำดับตามระยะ**: จากใกล้ไปไกล
- **แสดงระยะทาง**: กิโลเมตร/เมตร ตามความเหมาะสม

### 🚀 ประสิทธิภาพ
- **Debounce Search**: ลดการเรียก API ที่ไม่จำเป็น
- **Abort Controller**: ยกเลิก request ที่ล้าสมัย
- **Indexed Queries**: ใช้ Firestore indexes สำหรับความเร็ว
- **Caching**: เก็บผลลัพธ์ในหน่วยความจำ

## 🏗️ โครงสร้างไฟล์

```
src/
├── hooks/
│   ├── useSearchAll.ts          # Hook หลักสำหรับค้นหา
│   └── useUserLocation.ts       # Hook จัดการตำแหน่งผู้ใช้
├── components/
│   └── search/
│       └── GlobalSearchBox.tsx  # Component ค้นหาหลัก
├── types/
│   └── mall-system.ts           # Types ที่อัปเดตแล้ว
└── lib/
    └── firestore.ts             # Firestore operations
```

## 📊 โครงสร้างข้อมูล

### Mall Schema (อัปเดต)
```typescript
interface Mall {
  id?: string;
  name: string;                    // slug เช่น "central-rama-3"
  displayName: string;             // ชื่อโชว์
  nameLower?: string;              // ชื่อพิมพ์เล็กสำหรับค้นหา
  searchKeywords?: string[];       // คีย์เวิร์ดสำหรับค้นหา
  coords?: { lat: number; lng: number; };
  geohash?: string;                // สำหรับ geosearch
  storeCount?: number;             // จำนวนร้านในห้าง
  status?: "Active" | "Closed";
  // ... ฟิลด์อื่นๆ
}
```

### Store Schema (อัปเดต)
```typescript
interface Store {
  id?: string;
  name: string;
  nameLower?: string;              // ชื่อพิมพ์เล็กสำหรับค้นหา
  brandSlug?: string;              // slug ของแบรนด์
  mallId?: string;                 // FK to malls.id
  mallSlug?: string;               // denormalized mall slug
  location?: { lat?: number; lng?: number; };
  // ... ฟิลด์อื่นๆ
}
```

## 🚀 การใช้งาน

### 1. ติดตั้งและรันสคริปต์ปรับปรุงข้อมูล

```bash
# รันสคริปต์ปรับปรุงข้อมูล
npm run enhance-search-data

# หรือรันทีละส่วน
node scripts/enhance-search-data.js
```

### 2. ใช้ GlobalSearchBox Component

```tsx
import { GlobalSearchBox } from '../components/search/GlobalSearchBox';

function MyPage() {
  const handleMallSelect = (mall) => {
    // จัดการเมื่อเลือกห้าง
    console.log('Selected mall:', mall);
  };

  const handleStoreSelect = (store) => {
    // จัดการเมื่อเลือกร้าน
    console.log('Selected store:', store);
  };

  return (
    <GlobalSearchBox
      onMallSelect={handleMallSelect}
      onStoreSelect={handleStoreSelect}
      placeholder="ค้นหาห้างหรือร้านค้า..."
      showLocationButton={true}
    />
  );
}
```

### 3. ใช้ Search Hook โดยตรง

```tsx
import { useSearchAll } from '../hooks/useSearchAll';

function MyComponent() {
  const { searchAll, isLoading, error } = useSearchAll();

  const handleSearch = async () => {
    const results = await searchAll({
      keyword: 'uniqlo',
      userLocation: { lat: 13.7563, lng: 100.5018 },
      limit: 20,
      includeMalls: true,
      includeStores: true
    });

    console.log('Malls:', results.malls);
    console.log('Stores:', results.stores);
  };

  return (
    <button onClick={handleSearch}>
      ค้นหา
    </button>
  );
}
```

## 🔧 การตั้งค่า Firestore Indexes

### 1. อัปเดต firestore.indexes.json

ไฟล์ `firestore.indexes.json` ได้รับการอัปเดตแล้วเพื่อรองรับการค้นหาใหม่

### 2. Deploy Indexes

```bash
# Deploy indexes ไปยัง Firestore
firebase deploy --only firestore:indexes
```

## 📈 ประสิทธิภาพและการ Optimize

### 1. Debounce Search
- หน่วงเวลา 300ms หลังผู้ใช้หยุดพิมพ์
- ลดการเรียก API ที่ไม่จำเป็น

### 2. Abort Controller
- ยกเลิก request ที่ล้าสมัย
- ป้องกัน race condition

### 3. Fallback Queries
- ใช้ fallback query ถ้า index ยังไม่พร้อม
- รองรับการใช้งานทันที

### 4. Distance Calculation
- คำนวณระยะทางเฉพาะเมื่อจำเป็น
- ใช้ Haversine formula ที่แม่นยำ

## 🧪 การทดสอบ

### 1. ทดสอบการค้นหา

```bash
# รัน E2E tests
npm run test:e2e

# รัน smoke tests
npm run test:pptr:smoke
```

### 2. ทดสอบ Performance

```bash
# Lighthouse tests
npm run lh:mobile
npm run lh:desktop
```

## 🔄 การอัปเดตข้อมูล

### 1. รันสคริปต์ปรับปรุงข้อมูล

```bash
npm run enhance-search-data
```

สคริปต์จะทำ:
- เพิ่ม `nameLower` ให้ทุกเอกสาร
- เพิ่ม `searchKeywords` ให้ห้าง
- เพิ่ม `brandSlug` ให้ร้าน
- ลบข้อมูลซ้ำ
- อัปเดต `storeCount`

### 2. ตรวจสอบผลลัพธ์

```bash
npm run check-data
```

## 🐛 การแก้ไขปัญหา

### 1. Index ไม่พร้อม
- ระบบจะใช้ fallback query อัตโนมัติ
- รอให้ index สร้างเสร็จ (อาจใช้เวลา 1-2 นาที)

### 2. ข้อมูลไม่ครบ
- รัน `npm run enhance-search-data` อีกครั้ง
- ตรวจสอบ console logs

### 3. การค้นหาไม่ทำงาน
- ตรวจสอบ Firestore rules
- ตรวจสอบ Firebase config

## 📝 TODO และ Roadmap

### Phase 1 ✅ (เสร็จแล้ว)
- [x] สร้าง GlobalSearchBox component
- [x] สร้าง useSearchAll hook
- [x] สร้าง useUserLocation hook
- [x] อัปเดต types และ schemas
- [x] สร้างสคริปต์ปรับปรุงข้อมูล
- [x] อัปเดต Firestore indexes

### Phase 2 🚧 (กำลังทำ)
- [ ] เพิ่ม geohash สำหรับ geosearch
- [ ] เพิ่ม brand index collection
- [ ] เพิ่ม search analytics
- [ ] เพิ่ม search suggestions

### Phase 3 📋 (แผน)
- [ ] เพิ่ม fuzzy search
- [ ] เพิ่ม search filters
- [ ] เพิ่ม search history
- [ ] เพิ่ม voice search

## 🤝 การมีส่วนร่วม

1. Fork โปรเจค
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไปยัง branch
5. สร้าง Pull Request

## 📄 License

MIT License - ดูรายละเอียดใน LICENSE file
