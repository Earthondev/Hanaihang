# Hanaihang — Stores Migration Guide

## 🎯 **เป้าหมาย**
ย้ายข้อมูล stores จาก root collection (`stores/{storeId}`) ไป nested collection (`malls/{mallId}/stores/{storeId}`) เพื่อให้โครงสร้างข้อมูลเป็นแบบเดียวทั่วทั้งระบบ

## 📋 **Prerequisites**

### **1. Environment Setup**
```bash
# ติดตั้ง dependencies
npm install firebase-admin dotenv

# สร้างไฟล์ .env
FIREBASE_PROJECT_ID=hanaihang-fe9ec
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

### **2. Service Account**
1. ไปที่ Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. ดาวน์โหลดไฟล์ JSON และเก็บไว้ในโปรเจค
4. ตั้งค่า `GOOGLE_APPLICATION_CREDENTIALS` ให้ชี้ไปที่ไฟล์นี้

## 🚀 **Migration Steps**

### **Step 1: Backup Data**
```bash
# สำคัญมาก! สำรองข้อมูลก่อนเสมอ
# ใช้ Firebase Console → Firestore → Export
# หรือใช้ gcloud command
gcloud firestore export gs://your-backup-bucket
```

### **Step 2: Dry Run (ทดสอบ)**
```bash
# ทดสอบการย้ายข้อมูลโดยไม่บันทึกจริง
npm run migrate:dry
# หรือ
node scripts/migrate-stores-to-nested.mjs --dry-run --batch=200
```

### **Step 3: Run Migration**
```bash
# รันการย้ายข้อมูลจริง
npm run migrate:run
# หรือ
node scripts/migrate-stores-to-nested.mjs --batch=200
```

### **Step 4: Resume (ถ้าล้มกลางทาง)**
```bash
# ถ้า migration หยุดกลางทาง สามารถ resume ได้
npm run migrate:resume <lastDocId>
# หรือ
node scripts/migrate-stores-to-nested.mjs --batch=200 --resume=<lastDocId>
```

### **Step 5: Verify Migration**
```bash
# ตรวจสอบผลการย้ายข้อมูล
npm run migrate:verify
# หรือ
node scripts/verify-migration.mjs
```

### **Step 6: Update Application Code**

#### **เปลี่ยน Service**
```typescript
// เปลี่ยนจาก
import { getStore, updateStore } from '../services/firebase/firestore';

// เป็น
import { getStore, updateStore } from '../services/firebase/stores-unified';
```

#### **Update Components**
- `StoreEditPage.tsx` - ใช้ nested collection
- `StoresTable.tsx` - ใช้ collectionGroup query
- `GlobalSearch.tsx` - ใช้ collectionGroup query

### **Step 7: Deploy New Rules**
```bash
# Deploy firestore rules ใหม่
firebase deploy --only firestore:rules
```

### **Step 8: Delete Root Stores (เมื่อมั่นใจ)**
```bash
# ลบ root stores หลังจากย้ายเสร็จแล้ว
npm run migrate:delete-root
# หรือ
node scripts/migrate-stores-to-nested.mjs --batch=200 --delete-root
```

## 📊 **Migration Script Options**

### **Flags**
- `--dry-run`: ทดสอบโดยไม่บันทึกข้อมูลจริง
- `--delete-root`: ลบ root stores หลังจากย้ายเสร็จ
- `--batch=N`: กำหนดขนาด batch (default: 100)
- `--resume=docId`: resume จาก document ID ที่กำหนด

### **Examples**
```bash
# ทดสอบ 50 รายการต่อ batch
node scripts/migrate-stores-to-nested.mjs --dry-run --batch=50

# ย้ายข้อมูลจริง 200 รายการต่อ batch
node scripts/migrate-stores-to-nested.mjs --batch=200

# ย้ายข้อมูลและลบ root stores
node scripts/migrate-stores-to-nested.mjs --batch=200 --delete-root

# Resume จาก document ID ที่กำหนด
node scripts/migrate-stores-to-nested.mjs --batch=200 --resume=abc123
```

## 🔍 **Verification Checklist**

### **Data Integrity**
- [ ] จำนวน stores ใน root collection = 0
- [ ] จำนวน stores ใน nested collections = จำนวนเดิม
- [ ] storeCount ของแต่ละห้างถูกต้อง
- [ ] ข้อมูล stores ครบถ้วน (name, category, status, etc.)

### **Application Functionality**
- [ ] Store list แสดงได้
- [ ] Store detail โหลดได้
- [ ] Store edit บันทึกได้
- [ ] Global search ทำงานได้
- [ ] Admin panel ใช้งานได้

### **Performance**
- [ ] Query performance ดีขึ้น
- [ ] ไม่มี index errors
- [ ] ไม่มี permission errors

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Index Error**
```
The query requires a COLLECTION_GROUP_ASC index for collection stores and field name
```
**Solution**: สร้าง index ใน Firebase Console หรือใช้ JavaScript sort แทน

#### **2. Permission Denied**
```
Permission denied for collection stores
```
**Solution**: ตรวจสอบ firestore rules และ service account permissions

#### **3. Mall Not Found**
```
Mall not found: mallId
```
**Solution**: ตรวจสอบว่า mallId ใน store data ถูกต้อง

#### **4. Batch Size Too Large**
```
Too many requests
```
**Solution**: ลด batch size หรือเพิ่ม delay ระหว่าง requests

### **Recovery Steps**

#### **ถ้า Migration ล้มเหลว**
1. หยุด migration script
2. ตรวจสอบ error logs
3. แก้ไขปัญหา
4. Resume จากจุดที่หยุด

#### **ถ้าต้องการ Rollback**
1. ใช้ backup data ที่สำรองไว้
2. Restore จาก Firebase Console
3. หรือใช้ gcloud command

## 📈 **Performance Benefits**

### **Before Migration**
- Mixed collection structure
- Complex fallback logic
- Inconsistent queries
- Performance issues

### **After Migration**
- Unified nested structure
- Simple collectionGroup queries
- Consistent data access
- Better performance

## 🔧 **Maintenance**

### **Regular Tasks**
- Monitor storeCount accuracy
- Check for orphaned stores
- Verify index performance
- Update migration scripts as needed

### **Monitoring**
- Firebase Console → Firestore → Usage
- Check query performance
- Monitor error rates
- Track data consistency

## 📞 **Support**

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ logs ใน migration script
2. ดู Firebase Console → Firestore → Usage
3. ตรวจสอบ firestore rules
4. ตรวจสอบ service account permissions

---

**⚠️ สำคัญ**: ทดสอบใน development environment ก่อนรันใน production เสมอ!
