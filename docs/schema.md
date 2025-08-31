# Firestore Schema Documentation

เอกสารโครงสร้างข้อมูล Firestore สำหรับ HaaNaiHang

## 📊 Collections Overview

```
firestore/
├── malls/                    # ห้างสรรพสินค้า
│   ├── {mallId}/
│   │   ├── floors/          # ชั้นของห้าง
│   │   │   └── {floorId}
│   │   └── stores/          # ร้านค้าในห้าง
│   │       └── {storeId}
│   └── {mallId}
└── stores/                   # Collection group สำหรับค้นหา
    └── {storeId}
```

## 🏬 Malls Collection

### Document Structure

```typescript
interface Mall {
  id?: string;                    // Auto-generated
  name: string;                   // Slug เช่น "central-rama-3"
  displayName: string;            // ชื่อแสดงผล เช่น "Central Rama 3"
  nameLower?: string;             // ชื่อพิมพ์เล็กสำหรับค้นหา
  searchKeywords?: string[];      // คีย์เวิร์ดสำหรับค้นหา
  address?: string;               // ที่อยู่
  district?: string;              // เขต/อำเภอ
  contact?: {
    phone?: string;               // เบอร์โทร
    website?: string;             // เว็บไซต์
    social?: string;              // Social media
  };
  coords?: {
    lat: number;                  // ละติจูด
    lng: number;                  // ลองจิจูด
  };
  geohash?: string;               // สำหรับ geosearch
  hours?: {
    open: string;                 // เวลาเปิด เช่น "10:00"
    close: string;                // เวลาปิด เช่น "22:00"
  };
  storeCount?: number;            // จำนวนร้านในห้าง (denormalized)
  status?: "Active" | "Closed";   // สถานะห้าง
  createdAt?: Timestamp;          // เวลาสร้าง
  updatedAt?: Timestamp;          // เวลาอัปเดต
}
```

### ตัวอย่าง Document

```json
{
  "name": "central-rama-3",
  "displayName": "Central Rama 3",
  "nameLower": "central rama 3",
  "searchKeywords": [
    "central rama 3",
    "centralrama3",
    "central-rama-3",
    "central rama iii",
    "เซ็นทรัล พระราม 3"
  ],
  "address": "79 Sathupradit Rd, Chong Nonsi, Yan Nawa, Bangkok",
  "district": "Bangkok",
  "contact": {
    "phone": "02-103-5333",
    "website": "https://www.central.co.th/"
  },
  "coords": {
    "lat": 13.6959,
    "lng": 100.5407
  },
  "geohash": "w4g0e8",
  "hours": {
    "open": "10:00",
    "close": "22:00"
  },
  "storeCount": 150,
  "status": "Active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 🏪 Stores Collection

### Document Structure

```typescript
interface Store {
  id?: string;                    // Auto-generated
  name: string;                   // ชื่อร้าน เช่น "UNIQLO"
  nameLower?: string;             // ชื่อพิมพ์เล็กสำหรับค้นหา
  brandSlug?: string;             // slug ของแบรนด์ เช่น "uniqlo"
  category: StoreCategory;        // หมวดหมู่
  floorId: string;                // อ้างอิง floors.{floorId}
  unit?: string;                  // ยูนิต เช่น "2-22"
  phone?: string | null;          // เบอร์โทร
  hours?: string | null;          // เวลาเปิด-ปิด เช่น "10:00-22:00"
  status: StoreStatus;            // สถานะร้าน
  // Location info
  mallId?: string;                // FK to malls.id
  mallSlug?: string;              // denormalized mall slug
  location?: {
    lat?: number;                 // ละติจูด (ถ้าไม่ใช้ mall coordinates)
    lng?: number;                 // ลองจิจูด (ถ้าไม่ใช้ mall coordinates)
    geohash?: string;             // สำหรับ geosearch
  };
  createdAt?: Timestamp;          // เวลาสร้าง
  updatedAt?: Timestamp;          // เวลาอัปเดต
}
```

### Store Categories

```typescript
type StoreCategory = 
  | "Fashion"
  | "Beauty"
  | "Electronics"
  | "Food & Beverage"
  | "Sports"
  | "Books"
  | "Home & Garden"
  | "Health & Pharmacy"
  | "Entertainment"
  | "Services";
```

### Store Status

```typescript
type StoreStatus = "Active" | "Maintenance" | "Closed";
```

### ตัวอย่าง Document

```json
{
  "name": "UNIQLO",
  "nameLower": "uniqlo",
  "brandSlug": "uniqlo",
  "category": "Fashion",
  "floorId": "floor-2",
  "unit": "2-22",
  "phone": "02-123-4567",
  "hours": "10:00-22:00",
  "status": "Active",
  "mallId": "central-rama-3",
  "mallSlug": "central-rama-3",
  "location": {
    "lat": 13.6959,
    "lng": 100.5407
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 🏢 Floors Collection

### Document Structure

```typescript
interface Floor {
  id?: string;                    // Auto-generated
  label: string;                  // ชื่อชั้น เช่น "G", "1", "2"
  order: number;                  // ลำดับชั้น 0, 1, 2, ...
  createdAt?: Timestamp;          // เวลาสร้าง
  updatedAt?: Timestamp;          // เวลาอัปเดต
}
```

### ตัวอย่าง Document

```json
{
  "label": "G",
  "order": 0,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 🔍 Search Indexes

### Mall Indexes

```javascript
// Prefix search สำหรับชื่อห้าง
{
  collectionGroup: "malls",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "nameLower", order: "ASCENDING" }
  ]
}

// Search by display name
{
  collectionGroup: "malls",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "displayName", order: "ASCENDING" }
  ]
}

// Filter by status
{
  collectionGroup: "malls",
  queryScope: "COLLECTION",
  fields: [
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "displayName", order: "ASCENDING" }
  ]
}
```

### Store Indexes

```javascript
// Global store search
{
  collectionGroup: "stores",
  queryScope: "COLLECTION_GROUP",
  fields: [
    { fieldPath: "nameLower", order: "ASCENDING" }
  ]
}

// Brand + Mall combination
{
  collectionGroup: "stores",
  queryScope: "COLLECTION_GROUP",
  fields: [
    { fieldPath: "brandSlug", order: "ASCENDING" },
    { fieldPath: "mallId", order: "ASCENDING" }
  ]
}

// Mall + Store name
{
  collectionGroup: "stores",
  queryScope: "COLLECTION_GROUP",
  fields: [
    { fieldPath: "mallId", order: "ASCENDING" },
    { fieldPath: "nameLower", order: "ASCENDING" }
  ]
}

// Category + Store name
{
  collectionGroup: "stores",
  queryScope: "COLLECTION_GROUP",
  fields: [
    { fieldPath: "category", order: "ASCENDING" },
    { fieldPath: "nameLower", order: "ASCENDING" }
  ]
}
```

## 🔐 Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Malls - อ่านได้ทุกคน เขียนได้เฉพาะผู้ที่เข้าสู่ระบบแล้ว
    match /malls/{mallId} {
      allow read: if true;
      allow write: if isSignedIn();
      
      // Floors
      match /floors/{floorId} {
        allow read: if true;
        allow write: if isSignedIn();
      }
      
      // Stores in mall
      match /stores/{storeId} {
        allow read: if true;
        allow write: if isSignedIn() && 
          request.resource.data.mallId == mallId;
      }
    }
    
    // Global stores collection
    match /stores/{storeId} {
      allow read: if true;
      allow write: if isSignedIn();
    }
  }
  
  // Helper function
  function isSignedIn() {
    return request.auth != null;
  }
}
```

## 📈 Data Relationships

### Entity Relationship Diagram

```
Mall (1) ──── (N) Floor
  │
  └── (N) Store
```

### Denormalization Strategy

1. **Store → Mall**: เก็บ `mallId` และ `mallSlug` ใน store document
2. **Store Count**: เก็บ `storeCount` ใน mall document (อัปเดตผ่าน Cloud Functions)
3. **Location**: เก็บ coordinates ใน store document (ถ้าไม่ใช้ mall coordinates)

### Data Consistency

- **Store Count**: อัปเดตผ่าน Cloud Function เมื่อ store ถูกเพิ่ม/ลบ
- **Brand Slug**: สร้างอัตโนมัติจาก store name
- **Search Keywords**: สร้างอัตโนมัติจาก mall name

## 🚀 Performance Considerations

### Indexing Strategy

1. **Prefix Search**: ใช้ `nameLower` field สำหรับ prefix search
2. **Composite Indexes**: สำหรับ queries ที่ใช้หลาย field
3. **Collection Group Queries**: สำหรับค้นหา stores ข้ามทุกห้าง

### Query Optimization

1. **Limit Results**: ใช้ `limit()` เพื่อจำกัดจำนวนผลลัพธ์
2. **Pagination**: ใช้ `startAt()` และ `endAt()` สำหรับ pagination
3. **Selective Fields**: ใช้ `select()` เพื่อดึงเฉพาะ field ที่ต้องการ

### Caching Strategy

1. **Client-side Caching**: ใช้ React Query สำหรับ caching
2. **Stale Time**: ตั้งค่า stale time 5 นาทีสำหรับข้อมูลที่ไม่เปลี่ยนแปลงบ่อย
3. **Background Updates**: อัปเดตข้อมูลในพื้นหลัง

## 🔄 Data Migration

### Migration Scripts

```bash
# รันสคริปต์ปรับปรุงข้อมูล
npm run enhance-search-data

# ตรวจสอบโครงสร้างข้อมูล
npm run check-data
```

### Migration Steps

1. **Add Search Fields**: เพิ่ม `nameLower`, `searchKeywords`, `brandSlug`
2. **Update Indexes**: สร้าง indexes ใหม่สำหรับ search
3. **Data Validation**: ตรวจสอบความถูกต้องของข้อมูล
4. **Performance Testing**: ทดสอบประสิทธิภาพหลัง migration
