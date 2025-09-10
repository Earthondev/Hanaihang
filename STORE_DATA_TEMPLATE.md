# 📋 คู่มือการเพิ่มข้อมูลร้านค้า

## 🏗️ โครงสร้างข้อมูลร้านค้า (Store)

### 📊 ข้อมูลหลัก (Required Fields)

| ฟิลด์ | ประเภท | คำอธิบาย | ตัวอย่าง |
|-------|--------|----------|---------|
| `name` | `string` | ชื่อร้านค้า | "Nike", "Starbucks", "Apple Store" |
| `category` | `StoreCategory` | หมวดหมู่ร้าน | "Fashion", "Food & Beverage" |
| `floorId` | `string` | **อ้างอิงจากชั้น** | ID ของชั้นที่ร้านตั้งอยู่ |
| `status` | `StoreStatus` | สถานะร้าน | "Active", "Maintenance", "Closed" |

### 📝 ข้อมูลเพิ่มเติม (Optional Fields)

| ฟิลด์ | ประเภท | คำอธิบาย | ตัวอย่าง |
|-------|--------|----------|---------|
| `unit` | `string` | หมายเลขยูนิต/ร้าน | "2-22", "A-15", "B-08" |
| `phone` | `string` | เบอร์โทรติดต่อ | "+66 81 234 5678" |
| `hours` | `string` | เวลาเปิด-ปิด | "10:00-22:00" |
| `brandSlug` | `string` | slug ของแบรนด์ | "nike", "starbucks" |

### 🔗 ข้อมูลอ้างอิง (Reference Fields)

| ฟิลด์ | ประเภท | คำอธิบาย | อ้างอิงจาก |
|-------|--------|----------|-----------|
| `mallId` | `string` | **อ้างอิงจากห้าง** | `malls/{mallId}` |
| `mallSlug` | `string` | slug ของห้าง | `malls.name` |
| `floorLabel` | `string` | ชื่อชั้น | `floors.label` |

### 📍 ข้อมูลตำแหน่ง (Location Fields)

| ฟิลด์ | ประเภท | คำอธิบาย | อ้างอิงจาก |
|-------|--------|----------|-----------|
| `location.lat` | `number` | ละติจูด | `malls.coords.lat` |
| `location.lng` | `number` | ลองจิจูด | `malls.coords.lng` |
| `location.geohash` | `string` | Geohash | คำนวณจาก lat/lng |

### 🏷️ หมวดหมู่ร้านค้า (Store Categories)

```typescript
const STORE_CATEGORIES = [
  'Fashion',           // แฟชั่น
  'Beauty',            // ความงาม
  'Electronics',       // อิเล็กทรอนิกส์
  'Food & Beverage',   // อาหาร & เครื่องดื่ม
  'Sports',            // กีฬา
  'Books',             // หนังสือ
  'Home & Garden',     // บ้าน & สวน
  'Health & Pharmacy', // สุขภาพ & ยา
  'Entertainment',     // ความบันเทิง
  'Services'           // บริการ
] as const;
```

### 📊 สถานะร้านค้า (Store Status)

```typescript
const STORE_STATUS = [
  'Active',      // เปิดทำการ
  'Maintenance', // ปิดปรับปรุง
  'Closed'       // ปิดทำการ
] as const;
```

## 🗂️ โครงสร้างฐานข้อมูล

### Firestore Collection Structure

```
malls/
├── {mallId}/
│   ├── floors/
│   │   └── {floorId}/
│   │       ├── label: "G", "1", "2", ...
│   │       ├── order: 0, 1, 2, ...
│   │       └── ...
│   └── stores/
│       └── {storeId}/
│           ├── name: "Nike"
│           ├── category: "Fashion"
│           ├── floorId: "{floorId}"
│           ├── unit: "2-22"
│           ├── phone: "+66 81 234 5678"
│           ├── hours: "10:00-22:00"
│           ├── status: "Active"
│           ├── mallId: "{mallId}"
│           ├── mallSlug: "central-rama-3"
│           ├── floorLabel: "2"
│           ├── location: {
│           │   ├── lat: 13.7563
│           │   ├── lng: 100.5018
│           │   └── geohash: "6ph..."
│           │   }
│           ├── createdAt: Timestamp
│           └── updatedAt: Timestamp
```

## 📝 ตัวอย่างข้อมูลร้านค้า

### ตัวอย่างที่ 1: ร้านแฟชั่น
```json
{
  "name": "Nike",
  "category": "Fashion",
  "floorId": "floor_2_id",
  "unit": "2-22",
  "phone": "+66 2 123 4567",
  "hours": "10:00-22:00",
  "status": "Active",
  "brandSlug": "nike",
  "mallId": "central-rama-3",
  "mallSlug": "central-rama-3",
  "floorLabel": "2",
  "location": {
    "lat": 13.7563,
    "lng": 100.5018,
    "geohash": "6ph..."
  }
}
```

### ตัวอย่างที่ 2: ร้านอาหาร
```json
{
  "name": "Starbucks",
  "category": "Food & Beverage",
  "floorId": "floor_g_id",
  "unit": "G-15",
  "phone": "+66 2 987 6543",
  "hours": "06:00-23:00",
  "status": "Active",
  "brandSlug": "starbucks",
  "mallId": "terminal-21-asok",
  "mallSlug": "terminal-21-asok",
  "floorLabel": "G",
  "location": {
    "lat": 13.7371,
    "lng": 100.5606,
    "geohash": "6ph..."
  }
}
```

### ตัวอย่างที่ 3: ร้านอิเล็กทรอนิกส์
```json
{
  "name": "Apple Store",
  "category": "Electronics",
  "floorId": "floor_3_id",
  "unit": "3-08",
  "phone": "+66 2 555 0123",
  "hours": "10:00-22:00",
  "status": "Active",
  "brandSlug": "apple",
  "mallId": "centralworld",
  "mallSlug": "centralworld",
  "floorLabel": "3",
  "location": {
    "lat": 13.7472,
    "lng": 100.5397,
    "geohash": "6ph..."
  }
}
```

## 🔧 วิธีการเพิ่มร้านค้า

### 1. ผ่าน Admin Panel
```
URL: /admin/stores/create
หรือ: /admin/stores/create?mallId={mallId}
```

### 2. ผ่าน API Script
```javascript
import { createStore } from './services/firebase/stores';

const storeData = {
  name: "Nike",
  category: "Fashion",
  floorId: "floor_2_id",
  unit: "2-22",
  phone: "+66 2 123 4567",
  hours: "10:00-22:00",
  status: "Active"
};

const storeId = await createStore("central-rama-3", storeData);
```

### 3. ผ่าน Bulk Import Script
```javascript
// scripts/add-stores.js
const stores = [
  {
    mallId: "central-rama-3",
    name: "Nike",
    category: "Fashion",
    floorId: "floor_2_id",
    unit: "2-22",
    phone: "+66 2 123 4567",
    hours: "10:00-22:00",
    status: "Active"
  },
  // ... more stores
];

for (const store of stores) {
  await createStore(store.mallId, store);
}
```

## ⚠️ ข้อควรระวัง

### 1. การอ้างอิงข้อมูล
- **mallId**: ต้องเป็น ID ที่มีอยู่ใน `malls` collection
- **floorId**: ต้องเป็น ID ที่มีอยู่ใน `malls/{mallId}/floors` collection
- **floorLabel**: จะถูก denormalize จาก `floors.label`

### 2. การ Denormalization
- `mallSlug`: คัดลอกจาก `malls.name`
- `floorLabel`: คัดลอกจาก `floors.label`
- `location`: คัดลอกจาก `malls.coords`

### 3. การอัปเดต Counter
- `storeCount` ใน `malls` จะถูกอัปเดตอัตโนมัติเมื่อเพิ่ม/ลบร้าน

### 4. การค้นหา
- ร้านจะถูกค้นหาได้ผ่าน `collectionGroup('stores')`
- รองรับการค้นหาข้ามห้าง
- มี `name_normalized` สำหรับการค้นหาที่ดีขึ้น

## 🎯 Best Practices

### 1. การตั้งชื่อร้าน
- ใช้ชื่อแบรนด์ที่ชัดเจน
- หลีกเลี่ยงชื่อที่ซ้ำกันในห้างเดียวกัน
- ใช้ `brandSlug` สำหรับการค้นหา

### 2. การจัดหมวดหมู่
- เลือกหมวดหมู่ที่เหมาะสม
- ใช้หมวดหมู่หลัก 10 หมวด
- หลีกเลี่ยงการสร้างหมวดหมู่ใหม่

### 3. การระบุตำแหน่ง
- ใช้ `unit` สำหรับระบุตำแหน่งที่ชัดเจน
- ตรวจสอบ `floorId` ให้ถูกต้อง
- อัปเดต `floorLabel` เมื่อเปลี่ยนชั้น

### 4. การจัดการเวลา
- ใช้รูปแบบ "HH:MM-HH:MM"
- ระบุเวลาที่ชัดเจน
- อัปเดตเมื่อมีการเปลี่ยนแปลง

## 📊 สถิติและรายงาน

### 1. จำนวนร้านต่อห้าง
```javascript
const mall = await getMall(mallId);
console.log(`จำนวนร้าน: ${mall.storeCount}`);
```

### 2. จำนวนร้านต่อชั้น
```javascript
const stores = await listStores(mallId, { floorId: "floor_2_id" });
console.log(`จำนวนร้านในชั้น 2: ${stores.length}`);
```

### 3. จำนวนร้านต่อหมวดหมู่
```javascript
const fashionStores = await listStores(mallId, { category: "Fashion" });
console.log(`จำนวนร้านแฟชั่น: ${fashionStores.length}`);
```

## 🔍 การค้นหาและกรอง

### 1. ค้นหาร้านในห้างเดียว
```javascript
const stores = await listStores(mallId, {
  floorId: "floor_2_id",
  category: "Fashion",
  status: "Active",
  query: "nike"
});
```

### 2. ค้นหาร้านข้ามห้าง
```javascript
const stores = await searchStoresGlobally("nike", 50);
```

### 3. ค้นหาร้านด้วย ID
```javascript
const result = await findStoreById("store_123");
if (result) {
  console.log(`ร้าน: ${result.store.name}`);
  console.log(`ห้าง: ${result.mallId}`);
}
```

---

## 📞 การติดต่อและสนับสนุน

หากมีคำถามหรือต้องการความช่วยเหลือในการเพิ่มข้อมูลร้านค้า กรุณาติดต่อทีมพัฒนา หรือสร้าง Issue ใน GitHub Repository

**Happy Coding! 🚀**