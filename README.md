
# 🏬 Mall & Store Finder System

ระบบค้นหาห้างสรรพสินค้าและร้านค้าที่พัฒนาด้วย React + TypeScript + Firebase

## ✨ ฟีเจอร์หลัก

### 👨‍💼 สำหรับผู้ดูแลระบบ (Admin Panel)
- **จัดการห้างสรรพสินค้า**: เพิ่ม แก้ไข ลบข้อมูลห้าง
- **จัดการร้านค้า**: เพิ่ม แก้ไข ลบ ร้านค้า พร้อมระบบทำสำเนา
- **ระบบค้นหาและกรอง**: ค้นหาร้านค้าตามชื่อ ห้าง หมวดหมู่
- **ข้อมูลตัวอย่าง**: เพิ่มข้อมูลห้างตัวอย่าง 10 แห่งด้วยปุ่มเดียว
- **การจัดการชั้น**: ระบบชั้นอัตโนมัติ (G, 1, 2, 3, 4, 5)

### 🌐 สำหรับผู้ใช้ทั่วไป (Public Pages)
- **หน้าหลัก**: ค้นหาร้านค้าแบบ Global + ใช้ตำแหน่งปัจจุบัน
- **หน้าห้าง**: ดูข้อมูลห้าง + ร้านค้าแยกตามชั้น
- **ค้นหาร้านค้า**: ค้นหาแบบ Global พร้อมแสดงระยะทาง

## 🚀 การติดตั้ง

### 1. Clone Repository
```bash
git clone https://github.com/Earthondev/Hanaihang.git
cd haa-nai-hang
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Firebase
1. สร้างโปรเจ็กต์ Firebase ใหม่
2. เปิดใช้งาน Firestore Database
3. เปิดใช้งาน Authentication (Email/Password)
4. คัดลอก Firebase Config ไปใส่ใน `src/config/firebase.ts`

### 4. Deploy Firestore Rules
```bash
npm run deploy:rules
```

### 5. รันโปรเจ็กต์
```bash
npm run dev
```

## 📁 โครงสร้างโปรเจ็กต์

```
src/
├── components/
│   ├── admin/           # คอมโพเนนต์สำหรับ Admin Panel
│   │   ├── MallForm.tsx
│   │   ├── StoreForm.tsx
│   │   ├── MallsTable.tsx
│   │   └── StoresTable.tsx
│   └── ui/              # คอมโพเนนต์ UI ทั่วไป
├── config/
│   └── firebase.ts      # Firebase Configuration
├── contexts/
│   ├── AuthContext.tsx  # Authentication Context
│   └── LocationContext.tsx # Geolocation Context
├── pages/
│   ├── AdminPanel.tsx   # หน้า Admin Panel
│   ├── Login.tsx        # หน้าเข้าสู่ระบบ
│   └── ...              # หน้าอื่นๆ
├── services/
│   └── firebaseFirestore.ts # Firebase API Functions
└── types/
    └── mall-system.ts   # TypeScript Interfaces
```

## 🔥 Firebase Configuration

### Firestore Collections

#### 1. Malls Collection
```typescript
{
  id: string;                    // Auto-generated
  name: string;                  // Slug (e.g., "central-rama-3")
  displayName: string;           // ชื่อแสดงผล
  address: string;               // ที่อยู่
  district: string;              // เขต/อำเภอ
  coords: { lat: number; lng: number };
  hours: { open: string; close: string };
  contact: { phone?: string; website?: string };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. Stores Collection
```typescript
{
  id: string;                    // Auto-generated
  name: string;                  // ชื่อร้านค้า
  category: string;              // หมวดหมู่
  mallId: string;                // Reference to mall
  floorId: string;               // ชั้น (G, 1, 2, 3, 4, 5)
  unit: string;                  // ยูนิต
  phone?: string;                // เบอร์โทร
  hours?: string;                // เวลาเปิด-ปิด
  status: "Active" | "Maintenance" | "Closed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อ่านได้ทุกคน เขียนได้เฉพาะผู้ที่เข้าสู่ระบบแล้ว
    match /malls/{mallId} {
      allow read: if true;
      allow write: if isSignedIn();
      
      match /floors/{floorId} {
        allow read: if true;
        allow write: if isSignedIn();
      }
      
      match /stores/{storeId} {
        allow read: if true;
        allow write: if isSignedIn() && request.resource.data.mallId == mallId;
      }
    }
    
    match /stores/{storeId} {
      allow read: if true;
      allow write: if isSignedIn();
    }
  }
}
```

## 🛠️ API Functions

### Mall Operations
```typescript
// สร้างห้างใหม่
await firebaseFirestore.createMall(mallData);

// ดึงรายการห้างทั้งหมด
const malls = await firebaseFirestore.getMalls();

// อัปเดตข้อมูลห้าง
await firebaseFirestore.updateMall(mallId, updates);

// ลบห้าง
await firebaseFirestore.deleteMall(mallId);
```

### Store Operations
```typescript
// สร้างร้านค้าใหม่
await firebaseFirestore.createStore(storeData);

// ดึงรายการร้านค้าทั้งหมด
const stores = await firebaseFirestore.getStores();

// ค้นหาร้านค้าแบบ Global
const results = await firebaseFirestore.searchStoresGlobally(query);

// ทำสำเนาร้านค้า
await firebaseFirestore.duplicateStore(storeId);
```

### Seed Data
```typescript
// เพิ่มข้อมูลตัวอย่าง 10 ห้าง
await firebaseFirestore.seedMalls();
```

## 🎨 UI/UX Design

### Color Scheme
- **Primary**: `#16A34A` (Green)
- **Background**: `#F9FAFB` (Light Gray)
- **Text Primary**: `#111827` (Dark Gray)
- **Text Secondary**: `#4B5563` (Medium Gray)

### Typography
- **Kanit**: สำหรับหัวข้อ (Font Weight: 600)
- **Prompt**: สำหรับเนื้อหา (Font Weight: 400, 500)

### Components
- **Responsive Design**: รองรับทุกขนาดหน้าจอ
- **Loading States**: Skeleton และ Spinner
- **Toast Notifications**: แจ้งเตือนการทำงาน
- **Modal Forms**: ฟอร์มแบบ Modal
- **Data Tables**: ตารางข้อมูลพร้อมการกรอง

## 🔧 การพัฒนา

### Scripts
```bash
# Development
npm run dev

# Build Production
npm run build

# Run Tests
npm run test

# Deploy Firestore Rules
npm run deploy:rules
```

### Environment Variables
```bash
# .env.local
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

## 📊 Performance

### Optimization Features
- **React Query Caching**: Cache ข้อมูล 5 นาที
- **Lazy Loading**: โหลดคอมโพเนนต์เมื่อจำเป็น
- **Debounced Search**: ค้นหาแบบ Debounce
- **Pagination**: แบ่งหน้าข้อมูล
- **Image Optimization**: Optimize รูปภาพ

### Monitoring
- **Error Tracking**: Console.error logging
- **Performance Monitoring**: API call timing
- **User Analytics**: Page views และ interactions

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Firebase Hosting
```bash
# Build
npm run build

# Deploy
firebase deploy
```

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Firebase Setup Guide](./FIREBASE_SETUP.md)
- [Component Library](./COMPONENT_LIBRARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@example.com
- **GitHub Issues**: [Create Issue](https://github.com/Earthondev/Hanaihang/issues)
- **Documentation**: [Read Docs](https://your-docs.com)

## 🎯 Roadmap

### Phase 1 ✅ (Completed)
- [x] Admin Panel พื้นฐาน
- [x] CRUD Operations สำหรับ Malls และ Stores
- [x] Firebase Integration
- [x] Basic UI/UX

### Phase 2 🚧 (In Progress)
- [ ] Public Pages (Home, Mall Detail, Store Finder)
- [ ] Geolocation Features
- [ ] Advanced Search
- [ ] Mobile App

### Phase 3 📋 (Planned)
- [ ] Real-time Updates
- [ ] Push Notifications
- [ ] Analytics Dashboard
- [ ] Multi-language Support

---

**Made with ❤️ by Earthondev**
