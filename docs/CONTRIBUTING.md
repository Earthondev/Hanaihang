# Contributing to HaaNaiHang

ขอบคุณที่สนใจร่วมพัฒนา HaaNaiHang! เอกสารนี้จะช่วยให้คุณเริ่มต้นได้อย่างถูกต้อง

## 🚀 การเริ่มต้น

### 1. Fork และ Clone

```bash
# Fork repository บน GitHub
# จากนั้น clone ลงเครื่อง
git clone https://github.com/YOUR_USERNAME/hanaihang.git
cd hanaihang

# เพิ่ม upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/hanaihang.git
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment

สร้างไฟล์ `.env.local` และเพิ่ม Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🌿 Branch Strategy

### Branch Naming Convention

```
feat/feature-name          # ฟีเจอร์ใหม่
fix/bug-description        # แก้ไขบั๊ก
refactor/component-name    # ปรับปรุงโค้ด
docs/documentation-name    # อัปเดตเอกสาร
chore/task-description     # งานบำรุงรักษา
```

### ตัวอย่าง

```bash
git checkout -b feat/search-autocomplete
git checkout -b fix/mall-card-styling
git checkout -b refactor/search-hooks
```

## 📝 Commit Convention

ใช้ [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

feat(search): add brand+mall combined query with distance sort
fix(ui): resolve mall card responsive layout issue
refactor(stores): move firestore calls to features/stores/api
docs(readme): update installation instructions
chore(deps): remove unused dayjs-plugin
```

### Types

- `feat`: ฟีเจอร์ใหม่
- `fix`: แก้ไขบั๊ก
- `refactor`: ปรับปรุงโค้ด (ไม่เปลี่ยนพฤติกรรม)
- `docs`: อัปเดตเอกสาร
- `style`: การจัดรูปแบบ (formatting, missing semicolons, etc)
- `test`: เพิ่มหรือแก้ไขเทส
- `chore`: งานบำรุงรักษา (dependencies, build tools, etc)

## 🏗️ โครงสร้าง Feature

เมื่อเพิ่มฟีเจอร์ใหม่ ให้สร้างโฟลเดอร์ใน `src/features/`:

```
src/features/your-feature/
├── components/          # UI components
├── hooks/              # Custom hooks
├── lib/                # Business logic (ไม่ผูก UI)
├── types.ts            # Feature-specific types
└── index.ts            # Public API (barrel export)
```

### กติกา

1. **Feature Isolation**: ฟีเจอร์ไม่ควร import components ของฟีเจอร์อื่นโดยตรง
2. **Public API**: Export เฉพาะสิ่งที่จำเป็นผ่าน `index.ts`
3. **Business Logic**: แยก logic ออกจาก UI ไปไว้ใน `lib/`

## 🎨 Code Style

### ESLint & Prettier

```bash
# ตรวจสอบ code style
npm run lint

# แก้ไขอัตโนมัติ
npm run fix
```

### TypeScript

- ใช้ TypeScript strict mode
- กำหนด type ให้ชัดเจน
- หลีกเลี่ยง `any` type

### React

- ใช้ Functional Components + Hooks
- ใช้ TypeScript สำหรับ props
- แยก logic ออกจาก UI

## 🧪 Testing

### Unit Tests

```bash
# รันเทสทั้งหมด
npm run test

# รันเทสพร้อม UI
npm run test:ui

# รันเทสเฉพาะไฟล์
npm run test -- src/features/search/hooks/useSearchAll.test.ts
```

### E2E Tests

```bash
# รัน E2E tests
npm run test:e2e

# รัน E2E tests แบบ headed
npm run test:e2e:headed
```

### Test Fixtures

ใช้ข้อมูลจำลองจาก `src/test/fixtures/`:

```typescript
import { mockMalls, mockStores } from '../../test/fixtures/data/malls';
```

## 🔍 Code Quality Checks

ก่อนเปิด PR ให้รัน:

```bash
# ตรวจสอบทั้งหมด
npm run cleanup

# หรือรันทีละตัว
npm run lint      # ESLint
npm run depcheck  # Unused dependencies
npm run tsprune   # Unused exports
```

## 📋 Pull Request Process

### 1. สร้าง Branch

```bash
git checkout -b feat/your-feature-name
```

### 2. พัฒนาและ Commit

```bash
# พัฒนาโค้ด
git add .
git commit -m "feat(search): add autocomplete functionality"
```

### 3. Push และเปิด PR

```bash
git push origin feat/your-feature-name
# เปิด PR บน GitHub
```

### 4. PR Checklist

- [ ] Code ผ่าน lint checks
- [ ] ไม่มี unused dependencies
- [ ] ไม่มี unused exports
- [ ] มีเทสครอบคลุม
- [ ] อัปเดตเอกสาร (ถ้าจำเป็น)
- [ ] ผ่าน CI checks

## 🐛 การรายงานบั๊ก

### Bug Report Template

```markdown
## 🐛 Bug Description
อธิบายปัญหาที่เกิดขึ้น

## 🔄 Steps to Reproduce
1. ไปที่หน้า...
2. คลิกที่...
3. ดูผลลัพธ์...

## ✅ Expected Behavior
สิ่งที่ควรเกิดขึ้น

## ❌ Actual Behavior
สิ่งที่เกิดขึ้นจริง

## 📱 Environment
- OS: macOS/Windows/Linux
- Browser: Chrome/Firefox/Safari
- Version: 1.0.0

## 📸 Screenshots
แนบ screenshot (ถ้ามี)
```

## 💡 Feature Request

### Feature Request Template

```markdown
## 🚀 Feature Description
อธิบายฟีเจอร์ที่ต้องการ

## 🎯 Use Case
กรณีการใช้งาน

## 💭 Proposed Solution
แนวทางแก้ไข (ถ้ามี)

## 🔄 Alternative Solutions
ทางเลือกอื่น (ถ้ามี)
```

## 📞 การติดต่อ

- **GitHub Issues**: [Create Issue](https://github.com/your-username/hanaihang/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/hanaihang/discussions)

## 📄 License

เมื่อคุณ contribute คุณยอมรับว่าโค้ดของคุณจะอยู่ภายใต้ MIT License
