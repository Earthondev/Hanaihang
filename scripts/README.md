# Mall Data Cleanup Scripts

ชุดสคริปต์สำหรับทำความสะอาดข้อมูลห้างสรรพสินค้าใน Firestore

## 🚀 การใช้งาน

### 1. Pre-flight Checklist

```bash
# ตรวจสอบความพร้อมก่อนรัน
node scripts/pre-flight-checklist.mjs
```

### 2. เตรียมความพร้อม

```bash
# ใช้โปรเจกต์ที่ถูกต้อง
firebase use hanaihang-fe9ec

# Backup ฐานข้อมูล (สำคัญมาก!)
gcloud firestore export gs://<your-bucket>/backups/$(date +%Y%m%d-%H%M)

# Deploy indexes (ถ้ายังไม่ได้ทำ)
firebase deploy --only firestore:indexes
```

### 3. ทดสอบแบบ Dry Run

```bash
# ทดสอบทั้ง pipeline
node scripts/run-mall-cleanup.mjs --dry-run

# หรือทดสอบทีละสคริปต์
node scripts/merge-duplicates.mjs --dry-run
node scripts/convert-autoid-to-slug.mjs --dry-run
node scripts/recalc-counts.mjs --dry-run
node scripts/normalize-times-and-status.mjs --dry-run
node scripts/normalize-location-fields.mjs --dry-run
```

### 4. Spot Check (ลดความเสี่ยง)

```bash
# ทดสอบเฉพาะห้างเดียว
node scripts/merge-duplicates.mjs --only=centralworld
node scripts/convert-autoid-to-slug.mjs --only=central-ladprao
node scripts/recalc-counts.mjs --only=centralworld
node scripts/verify-cleanup-results.mjs --only=centralworld
```

### 5. รันจริงแบบเต็ม

```bash
# รันทั้งหมดพร้อมกัน (มี fail-fast)
node scripts/run-mall-cleanup.mjs

# หรือรันทีละสคริปต์ (แนะนำ)
node scripts/merge-duplicates.mjs
node scripts/convert-autoid-to-slug.mjs
node scripts/recalc-counts.mjs
node scripts/normalize-times-and-status.mjs
node scripts/normalize-location-fields.mjs
```

### 6. ตรวจสอบผลลัพธ์

```bash
# ตรวจสอบความถูกต้องแบบครอบคลุม
node scripts/verify-cleanup-results.mjs

# ตรวจสอบเฉพาะห้างเดียว
node scripts/verify-cleanup-results.mjs --only=centralworld

# ดูรายชื่อห้างหลัง cleanup
node scripts/list-malls.mjs
```

### 7. Post-cleanup Actions

```bash
# Deploy rules และ indexes
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules

# ตรวจสอบแอป
# - Admin UI: list/ค้นหา/แก้ไขร้าน, ย้ายร้านข้ามห้าง
# - User UI: ค้นหา/เปิด Mall Detail + Store Detail
# - Console: ไม่มี permission/index error
```

## 📋 สคริปต์ที่มี

| สคริปต์ | หน้าที่ | Flags |
|---------|---------|-------|
| `merge-duplicates.mjs` | รวม Mall ซ้ำ | `--dry-run`, `--only=<mallId>` |
| `convert-autoid-to-slug.mjs` | แปลง autoId เป็น slug | `--dry-run`, `--only=<mallId>` |
| `recalc-counts.mjs` | คำนวณ storeCount/floorCount | `--dry-run` |
| `normalize-times-and-status.mjs` | normalize เวลาและสถานะ | `--dry-run` |
| `normalize-location-fields.mjs` | normalize เขต/จังหวัด | `--dry-run` |
| `run-mall-cleanup.mjs` | รันทุกสคริปต์ตามลำดับ | - |
| `verify-cleanup-results.mjs` | ตรวจสอบผลลัพธ์ | - |
| `rollback-mall-cleanup.mjs` | rollback (จำกัด) | `--dry-run` |

## 🔧 Flags

- `--dry-run`: แสดงผลลัพธ์โดยไม่ทำการเปลี่ยนแปลงจริง
- `--only=<mallId>`: ประมวลผลเฉพาะห้างที่ระบุ

## 📊 ผลลัพธ์ที่คาดหวัง

### merge-duplicates.mjs
```
📋 Processing: 0oRW26lOfr6MuzRjvX3g → centralworld
   📊 Found: 6 floors, 1 stores
   🏢 Copying floors...
   🏪 Copying stores...
   📈 Updating counts...
   🗑️ Deleting source mall...
   ✅ Successfully merged: 6 floors, 1 stores
```

### convert-autoid-to-slug.mjs
```
📋 Converting: KTWkxDAgJb3VjefKgRhG → central-ladprao
   📊 Mall: Central Ladprao
   📝 Creating new mall document with slug ID...
   🏢 Copying floors...
   🏪 Copying stores...
   ✅ Successfully converted: 7 floors, 0 stores
```

### recalc-counts.mjs
```
1. Processing: Central Festival EastVille (central-festival-eastville)
   📈 Stores: 11, Floors: 6
   ✅ Updated successfully
```

## ⚠️ ความปลอดภัย

- **Backup**: ทำ backup ก่อนรันทุกครั้ง
- **Dry Run**: ทดสอบด้วย `--dry-run` ก่อนรันจริง
- **Fail Fast**: สคริปต์จะหยุดทันทีถ้าเกิดข้อผิดพลาด
- **Idempotent**: รันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ

## 🔍 การตรวจสอบ

หลังรันสคริปต์ ให้ตรวจสอบ:

1. **ไม่มี duplicate malls** (CentralWorld, ICONSIAM, The Mall Bangkapi)
2. **mallId = slug** สำหรับทุกห้าง
3. **store.mallId ตรงกับ path** ที่อยู่
4. **storeCount/floorCount ตรงกับจำนวนจริง**
5. **เวลาทำการและสถานะมีค่า**

## 🚨 Rollback

หากเกิดปัญหา:

```bash
# ใช้ backup
gcloud firestore import gs://<bucket>/backups/<timestamp>

# หรือใช้ rollback script (จำกัด)
node scripts/rollback-mall-cleanup.mjs --dry-run
```

## 🪤 กับดักที่พบบ่อย

| ปัญหา | วิธีแก้ |
|-------|---------|
| เอกสาร Mall ต้นทางไม่มี floors/stores subcollections | สคริปต์จะข้ามอย่างนุ่มนวล (log warning) |
| store ไม่มี mallId ขณะย้าย | สคริปต์จะใส่ guard บังคับให้กำหนด |
| เวลาทำการชนกัน (openTime/closeTime + hours) | ใช้ exclusive rule (hours มี → ลบ openTime/closeTime) |
| Index ยัง Building | ค้นหา/เรียงอาจ error ชั่วคราว ให้รอ Ready |
| Permission denied | ตรวจสอบ service-account.json และ Firebase project |

## 📝 หมายเหตุ

- สคริปต์ใช้ Firebase Client SDK (ไม่ใช่ Admin SDK)
- ต้องมี `service-account.json` ในโฟลเดอร์ root
- ทุกสคริปต์รองรับ `--dry-run` และ `--only` flags
- ใช้ `{ merge: true }` เพื่อความปลอดภัย
- มี fail-fast ใน `run-mall-cleanup.mjs`
- มี guard clauses เพื่อจัดการกับดักที่พบบ่อย
