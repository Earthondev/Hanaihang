# 🏢 Pattern ใหม่ของระบบ Database สำหรับการเพิ่มห้าง

## 📋 **ข้อมูลที่ระบบ Database ขอ (ตาม MallFormData Interface)**

### ✅ **ข้อมูลที่จำเป็น (Required)**

```typescript
{
  "displayName": "ชื่อห้างที่แสดง (เช่น CentralWorld, Siam Paragon)"
}
```

### 📞 **ข้อมูลติดต่อ (ไม่บังคับ)**

```typescript
{
  "phone": "เบอร์โทรศัพท์ (เช่น 02-123-4567)",
  "website": "เว็บไซต์ (เช่น https://www.centralworld.co.th)",
  "social": "โซเชียลมีเดีย (เช่น https://facebook.com/centralworld)"
}
```

### 📍 **ข้อมูลตำแหน่ง (ไม่บังคับ)**

```typescript
{
  "lat": 13.7472,
  "lng": 100.5396
}
```

### ⏰ **เวลาทำการ (ไม่บังคับ)**

```typescript
{
  "openTime": "10:00",
  "closeTime": "22:00"
}
```

### 🏢 **ข้อมูลที่อยู่ (ไม่บังคับ)**

```typescript
{
  "address": "ที่อยู่เต็ม (เช่น 999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330)",
  "district": "เขต/อำเภอ (เช่น เขตปทุมวัน, อำเภอเมือง)"
}
```

### 🔧 **ข้อมูลระบบ (ไม่บังคับ)**

```typescript
{
  "name": "slug-ของห้าง (เช่น central-world) - ระบบสร้างอัตโนมัติถ้าไม่ระบุ"
}
```

## 🎯 **ตัวอย่างข้อมูลที่ส่งให้ระบบ**

### ตัวอย่างที่ 1: ข้อมูลขั้นต่ำ
```json
{
  "displayName": "CentralWorld"
}
```

### ตัวอย่างที่ 2: ข้อมูลครบถ้วน
```json
{
  "displayName": "CentralWorld",
  "address": "999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
  "district": "เขตปทุมวัน",
  "phone": "02-646-1000",
  "website": "https://www.centralworld.co.th",
  "social": "https://facebook.com/centralworld",
  "lat": 13.7472,
  "lng": 100.5396,
  "openTime": "10:00",
  "closeTime": "22:00"
}
```

## 🔄 **สิ่งที่ระบบจะสร้างอัตโนมัติ**

เมื่อส่งข้อมูลไป ระบบจะสร้าง:

### 1. **ข้อมูลห้างใน Database**
```typescript
{
  "id": "auto-generated-id",
  "name": "central-world", // สร้างจาก displayName
  "displayName": "CentralWorld",
  "address": "999/9 ถนนราชดำริ...",
  "district": "เขตปทุมวัน",
  "contact": {
    "phone": "02-646-1000",
    "website": "https://www.centralworld.co.th",
    "social": "https://facebook.com/centralworld"
  },
  "coords": {
    "lat": 13.7472,
    "lng": 100.5396
  },
  "hours": {
    "open": "10:00",
    "close": "22:00"
  },
  "storeCount": 0,
  "floorCount": 6,
  "status": "Active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. **Floors เริ่มต้น (6 ชั้น)**
```typescript
// ใน subcollection: malls/{mallId}/floors
[
  { "id": "floor-1", "label": "G", "order": 0 },
  { "id": "floor-2", "label": "1", "order": 1 },
  { "id": "floor-3", "label": "2", "order": 2 },
  { "id": "floor-4", "label": "3", "order": 3 },
  { "id": "floor-5", "label": "4", "order": 4 },
  { "id": "floor-6", "label": "5", "order": 5 }
]
```

## 📊 **Database Structure**

### **Collection: `malls`**
```
malls/
├── {mallId}/
│   ├── displayName: "CentralWorld"
│   ├── name: "central-world"
│   ├── address: "999/9 ถนนราชดำริ..."
│   ├── district: "เขตปทุมวัน"
│   ├── contact: { phone, website, social }
│   ├── coords: { lat, lng }
│   ├── hours: { open, close }
│   ├── storeCount: 0
│   ├── floorCount: 6
│   ├── status: "Active"
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
```

### **Subcollection: `malls/{mallId}/floors`**
```
malls/{mallId}/floors/
├── {floorId1}/
│   ├── label: "G"
│   ├── order: 0
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
├── {floorId2}/
│   ├── label: "1"
│   ├── order: 1
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
└── ... (ชั้นอื่นๆ)
```

## 🚀 **วิธีการส่งข้อมูล**

### **วิธีที่ 1: ผ่าน Admin Panel**
1. เข้า `http://localhost:5174/admin/malls`
2. กดปุ่ม "เพิ่มห้างใหม่"
3. กรอกข้อมูลในฟอร์ม
4. กด "สร้างห้าง"

### **วิธีที่ 2: ผ่าน API**
```javascript
// เรียกใช้ฟังก์ชัน createMall
import { createMall } from './services/firebase/firestore';

const mallData = {
  displayName: "CentralWorld",
  address: "999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
  district: "เขตปทุมวัน",
  phone: "02-646-1000",
  website: "https://www.centralworld.co.th",
  social: "https://facebook.com/centralworld",
  lat: 13.7472,
  lng: 100.5396,
  openTime: "10:00",
  closeTime: "22:00"
};

const mallId = await createMall(mallData);
console.log('ห้างถูกสร้างแล้ว ID:', mallId);
```

### **วิธีที่ 3: ผ่าน Script**
```javascript
// ใช้ script เช่น add-mall.js
const malls = [
  {
    displayName: "CentralWorld",
    address: "999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
    district: "เขตปทุมวัน",
    phone: "02-646-1000",
    website: "https://www.centralworld.co.th",
    social: "https://facebook.com/centralworld",
    lat: 13.7472,
    lng: 100.5396,
    openTime: "10:00",
    closeTime: "22:00"
  }
];

// รัน script
node scripts/add-mall.js
```

## ⚠️ **ข้อควรระวัง**

1. **displayName**: ต้องมีอย่างน้อย 2 ตัวอักษร
2. **address**: ถ้ามีต้องมีอย่างน้อย 6 ตัวอักษร
3. **district**: ถ้ามีต้องมีอย่างน้อย 2 ตัวอักษร
4. **phone**: รูปแบบ 02-123-4567 หรือ +66-2-123-4567
5. **website**: ต้องขึ้นต้นด้วย http:// หรือ https://
6. **lat/lng**: ต้องอยู่ในช่วงที่ถูกต้อง (-90 ถึง 90, -180 ถึง 180)
7. **เวลา**: รูปแบบ HH:MM เช่น 10:00, 22:00

## 📝 **Validation Rules**

ระบบจะตรวจสอบข้อมูลตาม `mallSchema`:

```typescript
const mallSchema = z.object({
  displayName: z.string().min(2, "กรุณากรอกชื่อห้าง"),
  name: z.string().optional(),
  address: z.string().min(6, "กรอกที่อยู่ให้ครบถ้วน"),
  district: z.string().min(2, "เลือกเขต/อำเภอ"),
  phone: z.string().optional().refine(v => v === "" || /^\+?\d[\d\s-]{6,}$/.test(v), "รูปแบบเบอร์ไม่ถูกต้อง"),
  website: z.string().optional().refine(v => v === "" || /^https?:\/\/.+/.test(v), "ต้องขึ้นต้นด้วย http:// หรือ https://"),
  social: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});
```

## 🎉 **สรุป**

**ข้อมูลขั้นต่ำที่ต้องส่ง**: `displayName` เท่านั้น!

**ข้อมูลเพิ่มเติม**: ใส่ได้ตามต้องการเพื่อความสมบูรณ์

**ระบบจะจัดการ**: สร้าง slug, floors เริ่มต้น, timestamps อัตโนมัติ
