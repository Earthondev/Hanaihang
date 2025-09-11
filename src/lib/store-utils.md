# Store Utils

ยูทิลิตี้สำหรับจัดการข้อมูลร้านค้าใน React Table แก้ปัญหา duplicate key warnings และจัดการ pagination/infinite scroll

## ฟีเจอร์หลัก

✅ **แก้ Duplicate Key Warnings** - ใช้ unique path key ข้ามทุกห้าง  
✅ **TypeScript Safe** - ไม่ต้อง cast, type รับประกัน  
✅ **Pagination Support** - merge ข้อมูลแบบไม่ซ้ำ  
✅ **Performance Optimized** - ใช้ Map สำหรับ deduplication  
✅ **React Ready** - ใช้ได้ทันทีใน JSX  

## API Reference

### Core Functions

#### `storePathKey(mallId, storeId)`
สร้าง unique path key สำหรับร้าน
```typescript
storePathKey('central-rama-3', 'hm-001')
// → 'malls/central-rama-3/stores/hm-001'
```

#### `getStoreReactKey(store)`
สร้าง React key สำหรับ `<tr key={...}>`
```typescript
getStoreReactKey({ id: 'hm-001', mallId: 'central-rama-3' })
// → 'malls/central-rama-3/stores/hm-001'
```

### Data Processing

#### `ensureStorePath(store)`
เติม `_path` ให้รายการเดียว (ไม่แก้ของเดิม)
```typescript
const store = { id: 'hm-001', mallId: 'central-rama-3' };
const withPath = ensureStorePath(store);
// → { id: 'hm-001', mallId: 'central-rama-3', _path: 'malls/central-rama-3/stores/hm-001' }
```

#### `withStorePaths(stores)`
เติม `_path` ให้ทั้งลิสต์
```typescript
const stores = [{ id: 'hm-001', mallId: 'central-rama-3' }];
const withPaths = withStorePaths(stores);
// → [{ id: 'hm-001', mallId: 'central-rama-3', _path: 'malls/central-rama-3/stores/hm-001' }]
```

#### `deduplicateStores(stores)`
ลบรายการซ้ำ โดยยึด `_path` เป็น unique key
```typescript
const stores = [
  { id: 'hm-001', mallId: 'central-rama-3' },
  { id: 'hm-001', mallId: 'central-rama-3' }, // ซ้ำ
  { id: 'hm-002', mallId: 'central-rama-3' }
];
const unique = deduplicateStores(stores);
// → [{ id: 'hm-001', mallId: 'central-rama-3', _path: '...' }, { id: 'hm-002', mallId: 'central-rama-3', _path: '...' }]
```

#### `mergeUniqueStores(prev, incoming)`
รวมรายการแบบ unique สำหรับ pagination
```typescript
const prev = [{ id: 'hm-001', mallId: 'central-rama-3' }];
const incoming = [{ id: 'hm-002', mallId: 'central-rama-3' }];
const merged = mergeUniqueStores(prev, incoming);
// → [{ id: 'hm-001', mallId: 'central-rama-3', _path: '...' }, { id: 'hm-002', mallId: 'central-rama-3', _path: '...' }]
```

### Utility Functions

#### `isSameStore(a, b)`
เปรียบเทียบว่าเป็นร้านเดียวกันหรือไม่
```typescript
isSameStore(
  { id: 'hm-001', mallId: 'central-rama-3' },
  { id: 'hm-001', mallId: 'central-rama-3' }
)
// → true
```

## วิธีใช้งาน

### 1. Basic Table (แก้ duplicate key warnings)

```tsx
import { deduplicateStores, getStoreReactKey } from './store-utils';

function StoresTable({ stores }) {
  const data = useMemo(() => deduplicateStores(stores), [stores]);

  return (
    <table>
      <tbody>
        {data.map((store) => (
          <tr key={getStoreReactKey(store)}>
            {/* cells ... */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 2. Pagination

```tsx
import { mergeUniqueStores } from './store-utils';

function usePagination() {
  const [stores, setStores] = useState([]);

  const loadMore = useCallback(async () => {
    const newStores = await fetchStores(page + 1);
    setStores(prev => mergeUniqueStores(prev, newStores));
  }, [page]);

  return { stores, loadMore };
}
```

### 3. Infinite Scroll

```tsx
import { mergeUniqueStores } from './store-utils';

function useInfiniteScroll() {
  const [stores, setStores] = useState([]);

  const loadMore = useCallback(async () => {
    const newStores = await fetchStores(offset);
    setStores(prev => mergeUniqueStores(prev, newStores));
  }, [offset]);

  return { stores, loadMore };
}
```

### 4. Real-time Updates

```tsx
import { mergeUniqueStores, deduplicateStores } from './store-utils';

function useRealtimeStores() {
  const [stores, setStores] = useState([]);

  const addStore = useCallback((newStore) => {
    setStores(prev => mergeUniqueStores(prev, [newStore]));
  }, []);

  const replaceStores = useCallback((newStores) => {
    setStores(deduplicateStores(newStores));
  }, []);

  return { stores, addStore, replaceStores };
}
```

## Guard Functions

### กรองข้อมูลที่ไม่ถูกต้อง

```tsx
import { useStoreGuard } from './store-utils';

function useStores(rawData) {
  // กรองเฉพาะข้อมูลที่มี id และ mallId
  const validStores = useStoreGuard(rawData);
  
  return validStores;
}
```

## Best Practices

### 1. ใช้ `deduplicateStores` เมื่อโหลดข้อมูลใหม่
```tsx
// ✅ ดี
setStores(deduplicateStores(incoming));

// ❌ ไม่ดี (อาจซ้ำ)
setStores(incoming);
```

### 2. ใช้ `mergeUniqueStores` สำหรับ pagination
```tsx
// ✅ ดี
setStores(prev => mergeUniqueStores(prev, incoming));

// ❌ ไม่ดี (จะซ้ำ)
setStores(prev => [...prev, ...incoming]);
```

### 3. ใช้ `getStoreReactKey` ใน JSX
```tsx
// ✅ ดี
<tr key={getStoreReactKey(store)}>

// ❌ ไม่ดี (อาจซ้ำ)
<tr key={`${store.id}-${store.mallId}`}>
```

### 4. ใช้ `withStorePaths` เมื่อต้องการ `_path` ล่วงหน้า
```tsx
// ✅ ดี
const data = withStorePaths(stores);

// ❌ ไม่ดี (ต้องคำนวณทุกครั้ง)
const data = stores.map(store => ({ ...store, _path: storePathKey(store.mallId, store.id) }));
```

## Troubleshooting

### Q: ยังเห็น duplicate key warnings
A: ตรวจสอบว่าใช้ `deduplicateStores` หรือ `mergeUniqueStores` แล้วหรือยัง

### Q: ข้อมูลหายไปตอน pagination
A: ตรวจสอบว่าใช้ `mergeUniqueStores` แทน `[...prev, ...incoming]`

### Q: TypeScript errors
A: ตรวจสอบว่าใช้ `StoreRow` interface และฟังก์ชันที่รับประกัน type

### Q: Performance ช้า
A: ใช้ `useMemo` กับ `deduplicateStores` และ `withStorePaths`
