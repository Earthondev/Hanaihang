# Firestore Migration Guide: Stores to Subcollections

## 🎯 **ปัญหาที่แก้ไข**

**ปัญหาเดิม:**
- ร้านเก่าอยู่ใน `/stores` (top-level collection)
- ร้านใหม่อยู่ใน `/malls/{mallId}/stores` (subcollection)
- โค้ดคาดหวัง subcollection แต่บางที่ยังใช้ top-level
- การค้นหาและนับร้านไม่สอดคล้องกัน

**ผลลัพธ์:**
- ร้านที่เพิ่มจาก Admin แสดงได้ (เพราะอยู่ใน subcollection)
- ร้านเก่าไม่แสดง (เพราะอยู่ใน top-level)
- การค้นหาไม่เจอร้านทั้งหมด

## ✅ **การแก้ไข**

### **1. สร้างไฟล์ Paths Management**
`src/services/firebase/paths.ts`
- จัดการ collection paths แบบ centralized
- รองรับทั้ง subcollection และ collectionGroup
- Helper functions สำหรับ migration

### **2. สร้าง Stores Service ใหม่**
`src/services/firebase/stores.ts`
- ใช้ subcollection: `malls/{mallId}/stores/{storeId}`
- รองรับ collectionGroup สำหรับค้นหาข้ามห้าง
- Denormalized fields สำหรับ search performance
- Backward compatibility กับ legacy functions

### **3. อัปเดต Search Logic**
`src/lib/enhanced-search.ts`
- ใช้ `searchStoresGlobally()` จาก stores service
- รองรับ collectionGroup queries
- Transform results เป็น unified format

### **4. สร้าง Migration Script**
`scripts/migrate-stores-to-subcollections.mjs`
- ย้ายข้อมูลจาก `/stores` ไป `/malls/{mallId}/stores`
- เพิ่ม denormalized fields (`name_normalized`, `mallId`, etc.)
- อัปเดต mall store counts
- รองรับ dry-run และ verification

### **5. อัปเดต Legacy Functions**
`src/services/firebase/firestore.ts`
- เปลี่ยนเป็น wrapper functions ที่เรียก stores service
- Mark เป็น `@deprecated` เพื่อเตือนให้ใช้ service ใหม่
- Backward compatibility ยังคงทำงานได้

## 🚀 **วิธีการใช้งาน**

### **Step 1: Dry Run (แนะนำ)**
```bash
npm run migrate-stores:dry-run
```
ตรวจสอบว่าข้อมูลจะถูกย้ายอย่างไรโดยไม่ทำการเปลี่ยนแปลงจริง

### **Step 2: Migration**
```bash
npm run migrate-stores
```
ย้ายข้อมูลจริงจาก `/stores` ไป `/malls/{mallId}/stores`

### **Step 3: Verification**
```bash
npm run migrate-stores:verify
```
ตรวจสอบว่าการย้ายข้อมูลสำเร็จ

### **Step 4: Testing**
```bash
npm run test:e2e
```
ทดสอบว่าระบบค้นหาและแสดงผลทำงานถูกต้อง

## 📊 **โครงสร้างข้อมูลใหม่**

### **Before (Mixed Structure)**
```
/stores/{storeId}                    # ร้านเก่า
/malls/{mallId}/stores/{storeId}     # ร้านใหม่
```

### **After (Unified Structure)**
```
/malls/{mallId}/stores/{storeId}     # ร้านทั้งหมด
```

### **Store Document Structure**
```typescript
{
  // Basic fields
  name: string,
  category: string,
  floorId: string,
  unit: string,
  phone?: string,
  hours?: string,
  status: string,
  
  // Denormalized fields (for search)
  mallId: string,           // Reference to parent mall
  mallName: string,         // Mall display name
  mallCoords?: {lat, lng},  // Mall coordinates
  name_normalized: string,  // Normalized name for search
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔍 **การค้นหา**

### **Single Mall Search**
```typescript
// Query: malls/{mallId}/stores
const stores = await listStores(mallId, { category: 'fashion' });
```

### **Cross-Mall Search**
```typescript
// Query: collectionGroup('stores')
const results = await searchStoresGlobally('H&M');
```

### **Enhanced Search**
```typescript
// Uses collectionGroup internally
const results = await searchMallsAndStores('Central');
```

## 🛡️ **Security Rules**

### **Recommended Firestore Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Mall documents
    match /malls/{mallId} {
      allow read: if true;
      allow write: if request.auth != null;
      
      // Store subcollections
      match /stores/{storeId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      
      // Floor subcollections
      match /floors/{floorId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
}
```

## 📈 **Performance Benefits**

### **Before**
- ❌ Multiple queries to different collections
- ❌ Client-side filtering and sorting
- ❌ Inconsistent data structure
- ❌ Search performance issues

### **After**
- ✅ Single collectionGroup query for cross-mall search
- ✅ Server-side filtering with indexes
- ✅ Consistent subcollection structure
- ✅ Optimized search with denormalized fields

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Migration fails with "Missing mall"**
   - สร้าง mall documents ที่ขาดหายไปก่อน
   - ตรวจสอบ mallId ใน store documents

2. **Search returns no results**
   - ตรวจสอบ Firestore indexes
   - รัน `npm run enhance-search-data` เพื่อเพิ่ม normalized fields

3. **Store count shows 0**
   - รัน migration script อีกครั้ง
   - ตรวจสอบ mall store count updates

### **Verification Checklist**

- [ ] Migration script runs without errors
- [ ] All stores appear in subcollections
- [ ] Mall store counts are updated
- [ ] Search returns results from all malls
- [ ] Admin panel shows correct store counts
- [ ] E2E tests pass

## 🎉 **สรุป**

การแก้ไขนี้จะทำให้:

1. **ข้อมูลสอดคล้อง** - ร้านทั้งหมดอยู่ใน subcollection เดียวกัน
2. **การค้นหาเร็วขึ้น** - ใช้ collectionGroup และ indexes
3. **โค้ดง่ายขึ้น** - มี service เดียวสำหรับจัดการร้าน
4. **ขยายได้ง่าย** - โครงสร้างรองรับการเติบโตในอนาคต

ระบบจะทำงานได้เสถียรและรวดเร็วขึ้นมาก! 🚀
