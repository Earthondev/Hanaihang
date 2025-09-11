# 🏢 คู่มือการเพิ่มห้างสรรพสินค้าใหม่

## 📋 ข้อมูลที่จำเป็นสำหรับการเพิ่มห้าง

### ✅ **ข้อมูลพื้นฐาน (Required)**
```json
{
  "displayName": "ชื่อห้างที่แสดง (เช่น CentralWorld, Siam Paragon)",
  "address": "ที่อยู่เต็ม (เช่น 999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330)",
  "district": "เขต/อำเภอ (เช่น เขตปทุมวัน, อำเภอเมือง)"
}
```

### 📝 **ข้อมูลเสริม (Optional)**
```json
{
  "phone": "เบอร์โทรศัพท์ (เช่น 02-123-4567)",
  "website": "เว็บไซต์ (เช่น https://www.centralworld.co.th)",
  "social": "โซเชียลมีเดีย (เช่น https://facebook.com/centralworld)",
  "lat": 13.7472,
  "lng": 100.5396,
  "openTime": "10:00",
  "closeTime": "22:00",
  "about": "คำอธิบายห้าง",
  "priceRange": "฿฿",
  "investmentTHB": 1000,
  "siteAreaSqm": 10000,
  "grossAreaSqm": 50000,
  "leasableAreaSqm": 40000,
  "parkingSpaces": 500,
  "totalShops": 100,
  "floors": 6,
  "basements": 0,
  "featured": false
}
```

## 🚀 วิธีการเพิ่มห้าง

### **วิธีที่ 1: ใช้ Script แบบ Interactive**
```bash
node scripts/add-mall-complete.js --interactive
```
- ระบบจะถามข้อมูลทีละช่อง
- เหมาะสำหรับเพิ่มห้างเดียว

### **วิธีที่ 2: ใช้ไฟล์ JSON**
```bash
# สร้าง template
node scripts/add-mall-complete.js --template

# แก้ไขไฟล์ mall-template.json
# แล้วรัน
node scripts/add-mall-complete.js --file mall-template.json
```

### **วิธีที่ 3: ใช้ไฟล์ JSON หลายห้าง**
```json
[
  {
    "displayName": "CentralWorld",
    "address": "999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
    "district": "เขตปทุมวัน",
    "phone": "02-646-1000",
    "website": "https://www.centralworld.co.th",
    "lat": 13.7472,
    "lng": 100.5396,
    "openTime": "10:00",
    "closeTime": "22:00",
    "floors": 8,
    "basements": 3
  },
  {
    "displayName": "Siam Paragon",
    "address": "991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330",
    "district": "เขตปทุมวัน",
    "phone": "02-610-8000",
    "website": "https://www.siamparagon.co.th",
    "lat": 13.7464,
    "lng": 100.5351,
    "openTime": "10:00",
    "closeTime": "22:00",
    "floors": 7,
    "basements": 2
  }
]
```

## 📊 ข้อมูลที่ระบบจะสร้างอัตโนมัติ

เมื่อเพิ่มห้างใหม่ ระบบจะสร้าง:

### **1. ข้อมูลห้างใน Firestore**
- **ID**: สร้างอัตโนมัติ
- **Slug**: สร้างจากชื่อห้าง (เช่น "central-world")
- **Search Keywords**: สำหรับการค้นหา
- **Timestamps**: วันที่สร้างและอัปเดต
- **Status**: "Active" (เริ่มต้น)
- **Counts**: storeCount = 0, floorCount = จำนวนชั้นที่สร้าง

### **2. ชั้นของห้าง (Floors)**
- **ชั้นใต้ดิน**: B1, B2, B3 (ถ้าระบุ basements)
- **ชั้นล่าง**: G
- **ชั้นบน**: 1, 2, 3, 4, 5, 6, 7, 8 (ตามจำนวนที่ระบุ)

### **3. ตัวอย่างการสร้างชั้น**
```javascript
// ถ้า floors: 8, basements: 3
// จะสร้าง: B3, B2, B1, G, 1, 2, 3, 4, 5, 6, 7, 8 (12 ชั้น)
```

## 🔍 ตัวอย่างข้อมูลห้างจริง

### **Central Festival EastVille**
```json
{
  "displayName": "Central Festival EastVille",
  "address": "69, 69/1-2 ถนนประดิษฐ์มนูธรรม แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพมหานคร 10230",
  "district": "เขตลาดพร้าว",
  "phone": "02-102-5000",
  "website": "https://www.central.co.th/th/store/central-festival-eastville",
  "social": "https://facebook.com/CentralFestivalEastVille",
  "lat": 13.8055,
  "lng": 100.6033,
  "openTime": "10:00",
  "closeTime": "22:00",
  "about": "ศูนย์การค้าไลฟ์สไตล์แบบ Outdoor ที่ครบครันแห่งแรกในประเทศไทย",
  "priceRange": "฿฿฿",
  "investmentTHB": 6000,
  "siteAreaSqm": 81600,
  "grossAreaSqm": 160000,
  "leasableAreaSqm": 150000,
  "parkingSpaces": 1900,
  "totalShops": 300,
  "floors": 3,
  "basements": 0,
  "featured": true
}
```

### **CentralWorld**
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
  "closeTime": "22:00",
  "about": "ห้างสรรพสินค้าขนาดใหญ่ใจกลางกรุงเทพฯ",
  "priceRange": "฿฿฿",
  "investmentTHB": 15000,
  "siteAreaSqm": 50000,
  "grossAreaSqm": 200000,
  "leasableAreaSqm": 150000,
  "parkingSpaces": 3000,
  "totalShops": 500,
  "floors": 8,
  "basements": 3,
  "featured": true
}
```

## ⚠️ ข้อควรระวัง

### **ข้อมูลที่จำเป็น**
- `displayName`: ต้องกรอกและไม่ซ้ำ
- `address`: ต้องครบถ้วนและถูกต้อง
- `district`: ใช้ชื่อเขตหรืออำเภอที่ถูกต้อง

### **รูปแบบข้อมูล**
- **เบอร์โทร**: `02-123-4567` หรือ `+66-2-123-4567`
- **เว็บไซต์**: ต้องขึ้นต้นด้วย `http://` หรือ `https://`
- **พิกัด**: ใช้ระบบ WGS84 (Google Maps)
- **เวลา**: รูปแบบ `HH:MM` เช่น `10:00`, `22:00`
- **ราคา**: `฿`, `฿฿`, `฿฿฿`, `฿฿฿฿`

### **การตรวจสอบ**
- ตรวจสอบพิกัดด้วย Google Maps
- ตรวจสอบเบอร์โทรด้วยการโทร
- ตรวจสอบเว็บไซต์ด้วยการเข้าไปดู
- ตรวจสอบชื่อเขต/อำเภอให้ถูกต้อง

## 🎯 ตัวอย่างการใช้งาน

### **1. เพิ่มห้างเดียวแบบ Interactive**
```bash
node scripts/add-mall-complete.js --interactive
```

### **2. เพิ่มห้างจากไฟล์ JSON**
```bash
# สร้าง template
node scripts/add-mall-complete.js --template

# แก้ไขไฟล์ mall-template.json
# แล้วรัน
node scripts/add-mall-complete.js --file mall-template.json
```

### **3. เพิ่มห้างหลายห้าง**
```bash
# สร้างไฟล์ malls.json
# แล้วรัน
node scripts/add-mall-complete.js --file malls.json
```

## 📞 ติดต่อ

หากมีคำถามเกี่ยวกับการเตรียมข้อมูล สามารถสอบถามได้เลย!

---
*อัปเดตล่าสุด: $(date)*
*เวอร์ชัน: 1.0*
