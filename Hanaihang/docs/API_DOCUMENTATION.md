# API Documentation - Mall & Store Finder System

## ภาพรวม

ระบบ Mall & Store Finder ใช้ Firebase Firestore เป็นฐานข้อมูลหลัก และ Firebase Authentication สำหรับการยืนยันตัวตน

## การตั้งค่า Firebase

### 1. Firebase Configuration
```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 2. Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // สำหรับการทดสอบ - อนุญาตให้เขียนได้ถ้าเข้าสู่ระบบแล้ว
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

## โครงสร้างข้อมูล (Data Structure)

### 1. Malls Collection
```typescript
interface Mall {
  id: string;                    // Auto-generated
  name: string;                  // Slug (e.g., "central-rama-3")
  displayName: string;           // ชื่อแสดงผล (e.g., "Central Rama 3")
  address: string;               // ที่อยู่
  district: string;              // เขต/อำเภอ
  coords: {
    lat: number;
    lng: number;
  };
  hours: {
    open: string;                // "10:00"
    close: string;               // "22:00"
  };
  contact: {
    phone?: string;              // "02-123-4567"
    website?: string;            // "https://example.com"
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. Floors Collection (Subcollection of Malls)
```typescript
interface Floor {
  id: string;                    // "G", "1", "2", etc.
  label: string;                 // "G", "1", "2", etc.
  order: number;                 // 0, 1, 2, etc.
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. Stores Collection
```typescript
interface Store {
  id: string;                    // Auto-generated
  name: string;                  // ชื่อร้านค้า
  category: string;              // "Fashion", "Food & Beverage", etc.
  mallId: string;                // Reference to mall
  floorId: string;               // "G", "1", "2", etc.
  unit: string;                  // "2-22"
  phone?: string;                // "02-123-4567"
  hours?: string;                // "10:00-22:00"
  status: "Active" | "Maintenance" | "Closed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## API Functions

### 1. Mall Operations

#### สร้างห้างใหม่
```typescript
async function createMall(mallData: MallFormData): Promise<string>
```
**Parameters:**
- `mallData`: ข้อมูลห้างสรรพสินค้า
  - `displayName`: ชื่อแสดงผล (required)
  - `address`: ที่อยู่ (required)
  - `district`: เขต/อำเภอ (required)
  - `coords`: พิกัด (optional)
  - `hours`: เวลาเปิด-ปิด (required)
  - `contact`: ข้อมูลติดต่อ (optional)

**Returns:** ID ของห้างที่สร้างใหม่

**Example:**
```typescript
const mallData = {
  displayName: "Central Rama 3",
  address: "123 Rama 3 Road, Bangkok",
  district: "Yannawa",
  coords: { lat: 13.7563, lng: 100.5018 },
  hours: { open: "10:00", close: "22:00" },
  contact: { phone: "02-123-4567", website: "https://central.co.th" }
};

const mallId = await firebaseFirestore.createMall(mallData);
```

#### ดึงรายการห้างทั้งหมด
```typescript
async function getMalls(): Promise<Mall[]>
```
**Returns:** รายการห้างสรรพสินค้าทั้งหมด

#### ดึงข้อมูลห้างตาม ID
```typescript
async function getMall(mallId: string): Promise<Mall | null>
```
**Parameters:**
- `mallId`: ID ของห้าง

**Returns:** ข้อมูลห้างหรือ null ถ้าไม่พบ

#### อัปเดตข้อมูลห้าง
```typescript
async function updateMall(mallId: string, updates: Partial<Mall>): Promise<void>
```
**Parameters:**
- `mallId`: ID ของห้าง
- `updates`: ข้อมูลที่ต้องการอัปเดต

#### ลบห้าง
```typescript
async function deleteMall(mallId: string): Promise<void>
```
**Parameters:**
- `mallId`: ID ของห้าง

### 2. Store Operations

#### สร้างร้านค้าใหม่
```typescript
async function createStore(storeData: StoreFormData): Promise<string>
```
**Parameters:**
- `storeData`: ข้อมูลร้านค้า
  - `name`: ชื่อร้านค้า (required)
  - `category`: หมวดหมู่ (required)
  - `mallId`: ID ของห้าง (required)
  - `floorId`: ชั้น (required)
  - `unit`: ยูนิต (required)
  - `phone`: เบอร์โทร (optional)
  - `hours`: เวลาเปิด-ปิด (optional)
  - `status`: สถานะ (required)

**Returns:** ID ของร้านค้าที่สร้างใหม่

#### ดึงรายการร้านค้าทั้งหมด
```typescript
async function getStores(): Promise<Store[]>
```
**Returns:** รายการร้านค้าทั้งหมด

#### ค้นหาร้านค้าแบบ Global
```typescript
async function searchStoresGlobally(query: string): Promise<Store[]>
```
**Parameters:**
- `query`: คำค้นหา

**Returns:** รายการร้านค้าที่ตรงกับคำค้นหา

#### ดึงข้อมูลร้านค้าตาม ID
```typescript
async function getStore(storeId: string): Promise<Store | null>
```
**Parameters:**
- `storeId`: ID ของร้านค้า

**Returns:** ข้อมูลร้านค้าหรือ null ถ้าไม่พบ

#### อัปเดตข้อมูลร้านค้า
```typescript
async function updateStore(storeId: string, updates: Partial<Store>): Promise<void>
```
**Parameters:**
- `storeId`: ID ของร้านค้า
- `updates`: ข้อมูลที่ต้องการอัปเดต

#### ลบร้านค้า
```typescript
async function deleteStore(storeId: string): Promise<void>
```
**Parameters:**
- `storeId`: ID ของร้านค้า

#### ทำสำเนาร้านค้า
```typescript
async function duplicateStore(storeId: string, newMallId?: string): Promise<string>
```
**Parameters:**
- `storeId`: ID ของร้านค้าที่ต้องการทำสำเนา
- `newMallId`: ID ของห้างใหม่ (optional)

**Returns:** ID ของร้านค้าสำเนา

### 3. Floor Operations

#### สร้างชั้นเริ่มต้น
```typescript
async function createDefaultFloors(mallId: string): Promise<void>
```
**Parameters:**
- `mallId`: ID ของห้าง

**Description:** สร้างชั้น G, 1, 2, 3, 4, 5 สำหรับห้างใหม่

#### ดึงรายการชั้น
```typescript
async function getFloors(mallId: string): Promise<Floor[]>
```
**Parameters:**
- `mallId`: ID ของห้าง

**Returns:** รายการชั้นของห้าง

### 4. Seed Data

#### เพิ่มข้อมูลตัวอย่าง
```typescript
async function seedMalls(): Promise<void>
```
**Description:** เพิ่มห้างสรรพสินค้าตัวอย่าง 10 แห่งพร้อมข้อมูลครบถ้วน

## การใช้งานใน React Components

### 1. Admin Panel
```typescript
// src/pages/AdminPanel.tsx
import { firebaseFirestore } from '../services/firebaseFirestore';

const AdminPanel: React.FC = () => {
  const [malls, setMalls] = useState<Mall[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const loadData = async () => {
    const [mallsData, storesData] = await Promise.all([
      firebaseFirestore.getMalls(),
      firebaseFirestore.getStores()
    ]);
    setMalls(mallsData);
    setStores(storesData);
  };

  const handleAddMall = async (mallData: MallFormData) => {
    await firebaseFirestore.createMall(mallData);
    loadData(); // Reload data
  };

  const handleAddStore = async (storeData: StoreFormData) => {
    await firebaseFirestore.createStore(storeData);
    loadData(); // Reload data
  };
};
```

### 2. Mall Form
```typescript
// src/components/admin/MallForm.tsx
const MallForm: React.FC<MallFormProps> = ({ onSubmit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate slug from displayName
    const name = formData.displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const mallData = {
      ...formData,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSubmit(mallData);
  };
};
```

### 3. Store Form
```typescript
// src/components/admin/StoreForm.tsx
const StoreForm: React.FC<StoreFormProps> = ({ malls, onSubmit }) => {
  // Load floors when mall is selected
  useEffect(() => {
    if (formData.mallId) {
      loadFloors(formData.mallId);
    }
  }, [formData.mallId]);

  const loadFloors = async (mallId: string) => {
    const floors = await firebaseFirestore.getFloors(mallId);
    setFloors(floors);
  };
};
```

## Error Handling

### 1. Firebase Errors
```typescript
try {
  await firebaseFirestore.createMall(mallData);
  alert('✅ เพิ่มห้างสำเร็จ!');
} catch (error) {
  console.error('❌ Error adding mall:', error);
  alert('❌ เกิดข้อผิดพลาดในการเพิ่มห้าง');
}
```

### 2. Validation
```typescript
// Validate required fields
if (!formData.displayName || !formData.address || !formData.district) {
  alert('กรุณากรอกข้อมูลให้ครบถ้วน');
  return;
}

// Validate phone number format
const phoneRegex = /^0[0-9]{1,2}-[0-9]{3,4}-[0-9]{4}$/;
if (formData.contact.phone && !phoneRegex.test(formData.contact.phone)) {
  alert('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
  return;
}
```

## Performance Optimization

### 1. Indexes
สร้าง Firestore indexes สำหรับการค้นหาที่มีประสิทธิภาพ:

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "stores",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mallId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stores",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 2. Caching
ใช้ React Query หรือ SWR สำหรับ caching:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const useMalls = () => {
  return useQuery({
    queryKey: ['malls'],
    queryFn: () => firebaseFirestore.getMalls(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const useCreateMall = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mallData: MallFormData) => firebaseFirestore.createMall(mallData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['malls'] });
    },
  });
};
```

## Security Considerations

### 1. Authentication
```typescript
// Check if user is authenticated
const { user } = useAuth();
if (!user) {
  redirect('/login');
}
```

### 2. Input Validation
```typescript
// Sanitize input
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Validate email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### 3. Rate Limiting
```typescript
// Implement rate limiting for API calls
const rateLimiter = {
  lastCall: 0,
  minInterval: 1000, // 1 second
  
  canCall(): boolean {
    const now = Date.now();
    if (now - this.lastCall >= this.minInterval) {
      this.lastCall = now;
      return true;
    }
    return false;
  }
};
```

## Testing

### 1. Unit Tests
```typescript
// src/services/__tests__/firebaseFirestore.test.ts
import { firebaseFirestore } from '../firebaseFirestore';

describe('FirebaseFirestore', () => {
  test('should create mall successfully', async () => {
    const mallData = {
      displayName: 'Test Mall',
      address: 'Test Address',
      district: 'Test District',
      hours: { open: '10:00', close: '22:00' }
    };
    
    const mallId = await firebaseFirestore.createMall(mallData);
    expect(mallId).toBeDefined();
  });
});
```

### 2. Integration Tests
```typescript
// src/components/__tests__/MallForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MallForm from '../admin/MallForm';

test('should submit form with valid data', async () => {
  const mockOnSubmit = jest.fn();
  render(<MallForm onClose={() => {}} onSubmit={mockOnSubmit} />);
  
  fireEvent.change(screen.getByLabelText(/ชื่อห้างสรรพสินค้า/), {
    target: { value: 'Test Mall' }
  });
  
  fireEvent.click(screen.getByText('เพิ่มห้าง'));
  
  expect(mockOnSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      displayName: 'Test Mall',
      name: 'test-mall'
    })
  );
});
```

## Deployment

### 1. Build Production
```bash
npm run build
```

### 2. Deploy to Firebase Hosting
```bash
firebase deploy
```

### 3. Deploy Firestore Rules
```bash
npm run deploy:rules
```

## Monitoring & Analytics

### 1. Error Tracking
```typescript
// Track errors with console.error
console.error('❌ Error:', error);

// Or use external service like Sentry
Sentry.captureException(error);
```

### 2. Performance Monitoring
```typescript
// Track API call performance
const startTime = performance.now();
await firebaseFirestore.getMalls();
const endTime = performance.now();
console.log(`API call took ${endTime - startTime}ms`);
```

## Troubleshooting

### 1. Common Issues

#### Firebase Permission Denied
- ตรวจสอบ Firestore Rules
- ตรวจสอบการ Authentication
- ตรวจสอบ Project ID

#### Data Not Loading
- ตรวจสอบ Network Connection
- ตรวจสอบ Firebase Configuration
- ตรวจสอบ Collection Names

#### Form Validation Errors
- ตรวจสอบ Required Fields
- ตรวจสอบ Data Types
- ตรวจสอบ Field Names

### 2. Debug Mode
```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('🔍 Debug:', { malls, stores });
}
```

## Support

สำหรับคำถามหรือปัญหาทางเทคนิค กรุณาติดต่อ:
- Email: support@example.com
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://your-docs.com
