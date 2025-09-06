# 🖼️ ระบบจัดการโลโก้ห้างสรรพสินค้า

## ภาพรวม

ระบบจัดการโลโก้ห้างสรรพสินค้าที่ช่วยให้แอดมินสามารถอัปโหลดและจัดการโลโก้ของห้างสรรพสินค้าได้อย่างง่ายดาย โดยใช้ Firebase Storage เป็นที่เก็บไฟล์ และแสดงผลโลโก้จริงแทนตัวอักษรในหน้าเว็บหลัก

## 🏗️ โครงสร้างระบบ

### 1. Database Structure

เพิ่มฟิลด์ `logoUrl` ใน Mall interface:

```typescript
export interface Mall {
  id?: string;
  name: string;
  displayName: string;
  // ... other fields
  logoUrl?: string;      // URL ของโลโก้ห้างจาก Firebase Storage
  // ... other fields
}
```

### 2. Firebase Storage Structure

```
mall_logos/
├── central-rama-3.jpg
├── siam-paragon.png
├── terminal-21-asok.jpg
└── the-mall-bangkapi.png
```

### 3. Components

#### `LogoUpload.tsx`
- Component สำหรับอัปโหลดโลโก้
- รองรับการ drag & drop
- แสดง preview ก่อนอัปโหลด
- Validation ไฟล์ (ประเภท, ขนาด)
- Error handling

#### `MallLogoManager.tsx`
- Admin panel สำหรับจัดการโลโก้ทั้งหมด
- แสดงรายการห้างทั้งหมด
- Gallery view ของโลโก้
- การลบโลโก้

## 🚀 การใช้งาน

### สำหรับ Admin

1. **เข้าสู่ Admin Panel**
   ```
   /admin
   ```

2. **ไปที่แท็บ "🖼️ โลโก้ห้าง"**

3. **เลือกห้างที่ต้องการอัปโหลดโลโก้**

4. **อัปโหลดโลโก้**
   - คลิก "อัปโหลดโลโก้"
   - เลือกไฟล์รูปภาพ (JPG, PNG, GIF)
   - ขนาดไม่เกิน 5MB
   - ระบบจะอัปโหลดไปยัง Firebase Storage อัตโนมัติ

5. **จัดการโลโก้**
   - ดูโลโก้ทั้งหมดใน Gallery
   - ลบโลโก้ที่ไม่ต้องการ
   - เปลี่ยนโลโก้ใหม่

### สำหรับ User

- โลโก้จะแสดงอัตโนมัติในหน้าเว็บหลัก
- ถ้าไม่มีโลโก้ จะแสดงตัวอักษรแทน (fallback)
- ถ้าโลโก้โหลดไม่ได้ จะ fallback กลับไปใช้ตัวอักษร

## 📁 ไฟล์ที่เกี่ยวข้อง

### Core Files
- `src/types/mall-system.ts` - อัปเดต Mall interface
- `src/services/firebase/storage.ts` - Firebase Storage functions
- `src/components/ui/LogoUpload.tsx` - Upload component
- `src/components/admin/MallLogoManager.tsx` - Admin manager

### Updated Files
- `src/pages/Home.tsx` - แสดงโลโก้ในหน้าแรก
- `src/features/malls/components/MallCard.tsx` - แสดงโลโก้ใน MallCard
- `src/components/malls/MallCard.tsx` - แสดงโลโก้ใน MallCard (legacy)
- `src/components/forms/MallForm.tsx` - เพิ่มการอัปโหลดโลโก้
- `src/pages/AdminPanel.tsx` - เพิ่มแท็บโลโก้

## 🔧 Technical Details

### Firebase Storage Functions

```typescript
// อัปโหลดโลโก้ห้าง
uploadMallLogo(file: File, mallId: string): Promise<string>

// ลบโลโก้ห้าง
deleteMallLogo(mallId: string): Promise<void>

// ดึง URL โลโก้
getMallLogoUrl(mallId: string): Promise<string | null>
```

### File Validation

- **ประเภทไฟล์**: รองรับ JPG, PNG, GIF
- **ขนาดไฟล์**: สูงสุด 5MB สำหรับห้าง, 2MB สำหรับร้าน
- **ชื่อไฟล์**: ใช้ mallId เป็นชื่อไฟล์

### Error Handling

- ไฟล์ไม่ใช่รูปภาพ
- ไฟล์ใหญ่เกินไป
- การอัปโหลดล้มเหลว
- การลบไฟล์ล้มเหลว
- โลโก้โหลดไม่ได้ (fallback to text)

## 🎨 UI/UX Features

### Logo Display
- **ขนาด**: 16x16 (64px) สำหรับหน้าแรก, 12x12 (48px) สำหรับ MallCard
- **Style**: rounded-2xl, shadow, border
- **Fallback**: ตัวอักษรแรกของชื่อห้าง

### Upload Interface
- **Preview**: แสดงรูปก่อนอัปโหลด
- **Progress**: แสดงสถานะการอัปโหลด
- **Validation**: แจ้งเตือนข้อผิดพลาด
- **Remove**: ปุ่มลบโลโก้

### Admin Panel
- **Gallery View**: แสดงโลโก้ทั้งหมด
- **Selection**: เลือกห้างเพื่อแก้ไข
- **Bulk Operations**: ลบหลายโลโก้พร้อมกัน

## 🔒 Security

### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /mall_logos/{mallId} {
      allow read: if true;  // ทุกคนอ่านได้
      allow write: if request.auth != null;  // ต้องเข้าสู่ระบบ
    }
  }
}
```

### File Validation
- ตรวจสอบประเภทไฟล์
- ตรวจสอบขนาดไฟล์
- ตรวจสอบชื่อไฟล์

## 📱 Responsive Design

- **Mobile**: แสดงโลโก้ขนาดเล็ก
- **Tablet**: แสดงโลโก้ขนาดกลาง
- **Desktop**: แสดงโลโก้ขนาดใหญ่

## 🚀 Future Enhancements

1. **Store Logos**: เพิ่มระบบโลโก้ร้านค้า
2. **Bulk Upload**: อัปโหลดหลายโลโก้พร้อมกัน
3. **Image Optimization**: ปรับขนาดรูปอัตโนมัติ
4. **CDN Integration**: ใช้ CDN สำหรับความเร็ว
5. **Logo Templates**: เทมเพลตโลโก้สำเร็จรูป

## 🐛 Troubleshooting

### ปัญหาที่พบบ่อย

1. **โลโก้ไม่แสดง**
   - ตรวจสอบ URL ใน database
   - ตรวจสอบ Firebase Storage rules
   - ตรวจสอบ network connection

2. **อัปโหลดไม่ได้**
   - ตรวจสอบขนาดไฟล์
   - ตรวจสอบประเภทไฟล์
   - ตรวจสอบ Firebase Storage quota

3. **โลโก้แสดงผิด**
   - ตรวจสอบ aspect ratio
   - ตรวจสอบ file format
   - ลองอัปโหลดใหม่

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา

---

**สร้างโดย**: HaaNaiHang Development Team  
**อัปเดตล่าสุด**: 2024  
**เวอร์ชัน**: 1.0.0
