# 🏢 รูปแบบการเพิ่มข้อมูลห้างสรรพสินค้าที่ครบถ้วน

## 📋 ข้อมูลที่จำเป็น (Required Fields)

### 1. **ข้อมูลพื้นฐาน**
```json
{
  "displayName": "ชื่อห้างที่แสดง (เช่น CentralWorld, Siam Paragon)",
  "address": "ที่อยู่เต็ม (เช่น 999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330)",
  "district": "เขต/อำเภอ (เช่น เขตปทุมวัน, อำเภอเมือง)"
}
```

## 📝 ข้อมูลเสริม (Optional Fields)

### 2. **ข้อมูลติดต่อ**
```json
{
  "phone": "เบอร์โทรศัพท์ (เช่น 02-123-4567 หรือ +66-2-123-4567)",
  "website": "เว็บไซต์ (เช่น https://www.centralworld.co.th)",
  "social": "โซเชียลมีเดีย (เช่น https://facebook.com/centralworld)",
  "contact": {
    "phone": "เบอร์โทรหลัก",
    "email": "อีเมลติดต่อ",
    "website": "เว็บไซต์หลัก"
  },
  "socials": {
    "facebook": "facebook.com/centralworld",
    "instagram": "instagram.com/centralworld",
    "line": "@centralworld",
    "tiktok": "tiktok.com/@centralworld",
    "x": "x.com/centralworld"
  }
}
```

### 3. **ข้อมูลตำแหน่ง**
```json
{
  "lat": 13.7472,
  "lng": 100.5396,
  "coords": {
    "lat": 13.7472,
    "lng": 100.5396
  },
  "geohash": "w4g8y2k9x"
}
```

### 4. **เวลาทำการ**
```json
{
  "hours": {
    "open": "10:00",
    "close": "22:00"
  },
  "openTime": "10:00",
  "closeTime": "22:00"
}
```

### 5. **ข้อมูลเพิ่มเติม**
```json
{
  "name": "central-rama-3",
  "nameLower": "central rama 3",
  "searchKeywords": ["central", "rama", "3", "ห้างสรรพสินค้า"],
  "status": "Active",
  "logoUrl": "https://firebasestorage.googleapis.com/...",
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
  "floorCount": 8,
  "anchors": [
    {
      "name": "Central Department Store",
      "areaSqm": 50000,
      "notes": "สาขาหลัก"
    },
    {
      "name": "Tops Supermarket",
      "areaSqm": 3000,
      "notes": "ซูเปอร์มาร์เก็ต"
    }
  ]
}
```

## 🎯 รูปแบบข้อมูลครบถ้วน (Complete Format)

### **รูปแบบที่ 1: JSON Object (แนะนำ)**
```json
{
  "displayName": "CentralWorld",
  "name": "central-world",
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
  "floorCount": 8,
  "anchors": [
    {
      "name": "Central Department Store",
      "areaSqm": 50000,
      "notes": "สาขาหลัก"
    },
    {
      "name": "Tops Supermarket",
      "areaSqm": 3000,
      "notes": "ซูเปอร์มาร์เก็ต"
    }
  ],
  "contact": {
    "phone": "02-646-1000",
    "email": "info@centralworld.co.th",
    "website": "https://www.centralworld.co.th"
  },
  "socials": {
    "facebook": "facebook.com/centralworld",
    "instagram": "instagram.com/centralworld",
    "line": "@centralworld",
    "tiktok": "tiktok.com/@centralworld",
    "x": "x.com/centralworld"
  }
}
```

### **รูปแบบที่ 2: Excel/CSV Template**

| Field | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| displayName | string | ✅ | CentralWorld | ชื่อห้างที่แสดง |
| name | string | ❌ | central-world | Slug (สร้างอัตโนมัติ) |
| address | string | ✅ | 999/9 ถนนราชดำริ... | ที่อยู่เต็ม |
| district | string | ✅ | เขตปทุมวัน | เขต/อำเภอ |
| phone | string | ❌ | 02-646-1000 | เบอร์โทร |
| website | string | ❌ | https://www.centralworld.co.th | เว็บไซต์ |
| social | string | ❌ | https://facebook.com/centralworld | โซเชียลหลัก |
| lat | number | ❌ | 13.7472 | ละติจูด |
| lng | number | ❌ | 100.5396 | ลองจิจูด |
| openTime | string | ❌ | 10:00 | เวลาเปิด |
| closeTime | string | ❌ | 22:00 | เวลาปิด |
| about | string | ❌ | ห้างสรรพสินค้าขนาดใหญ่... | คำอธิบาย |
| priceRange | string | ❌ | ฿฿฿ | ระดับราคา |
| investmentTHB | number | ❌ | 15000 | เงินลงทุน (ล้านบาท) |
| siteAreaSqm | number | ❌ | 50000 | พื้นที่ทั้งโครงการ (ตร.ม.) |
| grossAreaSqm | number | ❌ | 200000 | พื้นที่รวม (ตร.ม.) |
| leasableAreaSqm | number | ❌ | 150000 | พื้นที่ให้เช่า (ตร.ม.) |
| parkingSpaces | number | ❌ | 3000 | ที่จอดรถ |
| totalShops | number | ❌ | 500 | จำนวนร้านทั้งหมด |
| floors | number | ❌ | 8 | จำนวนชั้นอาคาร (เหนือดิน) |
| basements | number | ❌ | 3 | จำนวนชั้นใต้ดิน |
| floorCount | number | ❌ | 8 | จำนวนชั้นทั้งหมด (ระบบนับอัตโนมัติ) |

### **รูปแบบที่ 3: JSON Array (สำหรับหลายห้าง)**
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
    "closeTime": "22:00"
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
    "closeTime": "22:00"
  }
]
```

## 🔍 ตัวอย่างข้อมูลห้างสรรพสินค้าจริง

### 1. **CentralWorld**
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
  "totalShops": 500
}
```

### 2. **Siam Paragon**
```json
{
  "displayName": "Siam Paragon",
  "address": "991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330",
  "district": "เขตปทุมวัน",
  "phone": "02-610-8000",
  "website": "https://www.siamparagon.co.th",
  "social": "https://facebook.com/siamparagon",
  "lat": 13.7464,
  "lng": 100.5351,
  "openTime": "10:00",
  "closeTime": "22:00",
  "about": "ห้างสรรพสินค้าลักซ์ชูรี่ใจกลางกรุงเทพฯ",
  "priceRange": "฿฿฿฿",
  "investmentTHB": 20000,
  "siteAreaSqm": 40000,
  "grossAreaSqm": 180000,
  "leasableAreaSqm": 120000,
  "parkingSpaces": 2500,
  "totalShops": 400
}
```

### 3. **ICONSIAM**
```json
{
  "displayName": "ICONSIAM",
  "address": "299 ถนนเจริญนคร แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600",
  "district": "เขตคลองสาน",
  "phone": "02-495-7000",
  "website": "https://www.iconsiam.com",
  "social": "https://facebook.com/iconsiam",
  "lat": 13.7296,
  "lng": 100.5140,
  "openTime": "10:00",
  "closeTime": "22:00",
  "about": "ห้างสรรพสินค้าลักซ์ชูรี่ริมแม่น้ำเจ้าพระยา",
  "priceRange": "฿฿฿฿",
  "investmentTHB": 25000,
  "siteAreaSqm": 60000,
  "grossAreaSqm": 250000,
  "leasableAreaSqm": 180000,
  "parkingSpaces": 4000,
  "totalShops": 600,
  "floors": 10,
  "basements": 2,
  "floorCount": 10
}
```

### 4. **Central Festival EastVille**
```json
{
  "displayName": "Central Festival EastVille",
  "name": "central-festival-eastville",
  "address": "69, 69/1-2 ถนนประดิษฐ์มนูธรรม แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพมหานคร 10230",
  "district": "เขตลาดพร้าว",
  "phone": "02-102-5000",
  "website": "https://www.central.co.th/th/store/central-festival-eastville",
  "socials": {
    "facebook": "https://facebook.com/CentralFestivalEastVille"
  },
  "lat": 13.8055,
  "lng": 100.6033,
  "openTime": "10:00",
  "closeTime": "22:00",
  "about": "ศูนย์การค้าไลฟ์สไตล์แบบ Outdoor ที่ครบครันแห่งแรกในประเทศไทย ตั้งอยู่บนถนนประดิษฐ์มนูธรรม",
  "priceRange": "฿฿฿",
  "investmentTHB": 6000,
  "siteAreaSqm": 81600,
  "grossAreaSqm": 160000,
  "leasableAreaSqm": 150000,
  "parkingSpaces": 1900,
  "totalShops": 300,
  "floors": 3,
  "basements": 0,
  "floorCount": 3,
  "anchors": [
    {
      "name": "Central Department Store"
    },
    {
      "name": "Central Food Hall"
    },
    {
      "name": "B2S"
    },
    {
      "name": "Power Buy"
    },
    {
      "name": "Supersports"
    }
  ]
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

## 🚀 วิธีการส่งข้อมูล

### **วิธีที่ 1: ไฟล์ JSON**
```bash
# สร้างไฟล์ malls.json
{
  "malls": [
    {
      "displayName": "CentralWorld",
      "address": "999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
      "district": "เขตปทุมวัน",
      "phone": "02-646-1000",
      "website": "https://www.centralworld.co.th",
      "lat": 13.7472,
      "lng": 100.5396,
      "openTime": "10:00",
      "closeTime": "22:00"
    }
  ]
}
```

### **วิธีที่ 2: ไฟล์ Excel/CSV**
ใช้ template ด้านบนและส่งไฟล์ `.xlsx` หรือ `.csv`

### **วิธีที่ 3: API Endpoint**
```bash
POST /api/malls
Content-Type: application/json

{
  "displayName": "CentralWorld",
  "address": "999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330",
  "district": "เขตปทุมวัน",
  "phone": "02-646-1000",
  "website": "https://www.centralworld.co.th",
  "lat": 13.7472,
  "lng": 100.5396,
  "openTime": "10:00",
  "closeTime": "22:00"
}
```

## 📊 ข้อมูลที่ระบบจะสร้างอัตโนมัติ

เมื่อเพิ่มห้างใหม่ ระบบจะสร้าง:
- **Floors เริ่มต้น**: G, 1, 2, 3, 4, 5 (6 ชั้น) หรือตามจำนวนที่ระบุใน `floors`
- **Slug**: สร้างจากชื่อห้าง (เช่น "central-world")
- **Search Keywords**: สำหรับการค้นหา
- **Timestamps**: วันที่สร้างและอัปเดต
- **Status**: "Active" (เริ่มต้น)
- **Counts**: storeCount = 0, floorCount = จำนวนชั้นที่สร้าง
- **Floor Count**: ระบบจะนับจำนวนชั้นอัตโนมัติจาก floors collection

## 🏢 ข้อมูลจำนวนชั้น (Floor Information)

### **ฟิลด์ที่เกี่ยวข้องกับชั้น**
- `floors`: จำนวนชั้นอาคารเหนือดิน (เช่น 8)
- `basements`: จำนวนชั้นใต้ดิน (เช่น 3)
- `floorCount`: จำนวนชั้นทั้งหมดที่ระบบนับอัตโนมัติ

### **ตัวอย่างการใช้งาน**
```json
{
  "floors": 8,        // ชั้น 1-8
  "basements": 3,     // ชั้นใต้ดิน B1-B3
  "floorCount": 8     // ระบบจะนับจาก floors collection
}
```

### **ระบบสร้าง Floors อัตโนมัติ**
- ถ้าไม่ระบุ `floors` → สร้าง 6 ชั้น (G, 1, 2, 3, 4, 5)
- ถ้าระบุ `floors: 8` → สร้าง 8 ชั้น (G, 1, 2, 3, 4, 5, 6, 7, 8)
- ถ้าระบุ `basements: 3` → สร้างชั้นใต้ดิน (B1, B2, B3)

## 📞 ติดต่อ

หากมีคำถามเกี่ยวกับการเตรียมข้อมูล สามารถสอบถามได้เลย!

---
*อัปเดตล่าสุด: $(date)*
*เวอร์ชัน: 2.0*

