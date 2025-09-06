# 🏢 Template สำหรับเตรียมข้อมูลห้างสรรพสินค้า

## 🎯 ข้อมูลที่จำเป็น (Required)

### 1. **ข้อมูลพื้นฐาน**
```json
{
  "displayName": "ชื่อห้างที่แสดง (เช่น CentralWorld, Siam Paragon)",
  "address": "ที่อยู่เต็ม (เช่น 999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330)",
  "district": "เขต/อำเภอ (เช่น เขตปทุมวัน, อำเภอเมือง)"
}
```

### 2. **ข้อมูลติดต่อ (ไม่บังคับ)**
```json
{
  "phone": "เบอร์โทรศัพท์ (เช่น 02-123-4567)",
  "website": "เว็บไซต์ (เช่น https://www.centralworld.co.th)",
  "social": "โซเชียลมีเดีย (เช่น https://facebook.com/centralworld)"
}
```

### 3. **ข้อมูลตำแหน่ง (ไม่บังคับ)**
```json
{
  "lat": 13.7472,
  "lng": 100.5396
}
```

### 4. **เวลาทำการ (ไม่บังคับ)**
```json
{
  "openTime": "10:00",
  "closeTime": "22:00"
}
```

## 📝 ตัวอย่างข้อมูลห้างสรรพสินค้า

### ตัวอย่างที่ 1: CentralWorld
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

### ตัวอย่างที่ 2: Siam Paragon
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
  "closeTime": "22:00"
}
```

### ตัวอย่างที่ 3: ICONSIAM
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
  "closeTime": "22:00"
}
```

## 📋 รูปแบบการส่งข้อมูล

### วิธีที่ 1: Excel/CSV
สร้างไฟล์ Excel หรือ CSV ด้วยคอลัมน์ดังนี้:

| displayName | address | district | phone | website | social | lat | lng | openTime | closeTime |
|-------------|---------|----------|-------|---------|--------|-----|-----|----------|-----------|
| CentralWorld | 999/9 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330 | เขตปทุมวัน | 02-646-1000 | https://www.centralworld.co.th | https://facebook.com/centralworld | 13.7472 | 100.5396 | 10:00 | 22:00 |
| Siam Paragon | 991 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330 | เขตปทุมวัน | 02-610-8000 | https://www.siamparagon.co.th | https://facebook.com/siamparagon | 13.7464 | 100.5351 | 10:00 | 22:00 |

### วิธีที่ 2: JSON Array
```json
[
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
  },
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
    "closeTime": "22:00"
  }
]
```

## ⚠️ ข้อควรระวัง

1. **ชื่อห้าง**: ใช้ชื่อที่ชัดเจนและเป็นทางการ
2. **ที่อยู่**: ต้องครบถ้วนและถูกต้อง
3. **เขต/อำเภอ**: ใช้ชื่อเขตหรืออำเภอที่ถูกต้อง
4. **เบอร์โทร**: รูปแบบ 02-123-4567 หรือ +66-2-123-4567
5. **เว็บไซต์**: ต้องขึ้นต้นด้วย http:// หรือ https://
6. **พิกัด**: ใช้ระบบ WGS84 (Google Maps)
7. **เวลา**: รูปแบบ 10:00 หรือ 22:00

## 🔍 วิธีหาพิกัด (Latitude, Longitude)

1. เปิด Google Maps
2. ค้นหาห้างสรรพสินค้า
3. คลิกขวาที่ตำแหน่งห้าง
4. เลือกพิกัดที่แสดง
5. คัดลอกตัวเลข (เช่น 13.7472, 100.5396)

## 🚀 วิธีการส่งข้อมูล

1. **เตรียมข้อมูล** ตาม template ด้านบน
2. **ตรวจสอบ** ให้แน่ใจว่าข้อมูลครบถ้วน
3. **ส่งให้ฉัน** ในรูปแบบ Excel, CSV, หรือ JSON
4. **ฉันจะเพิ่ม** ข้อมูลลงใน database พร้อมสร้าง floors เริ่มต้น

## 📊 ข้อมูลที่ระบบจะสร้างอัตโนมัติ

เมื่อเพิ่มห้างใหม่ ระบบจะสร้าง:
- **Floors เริ่มต้น**: G, 1, 2, 3, 4, 5 (6 ชั้น)
- **Slug**: สร้างจากชื่อห้าง (เช่น "central-world")
- **Search Keywords**: สำหรับการค้นหา
- **Timestamps**: วันที่สร้างและอัปเดต

## 📞 ติดต่อ

หากมีคำถามเกี่ยวกับการเตรียมข้อมูล สามารถสอบถามได้เลย!
