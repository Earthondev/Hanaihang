# HaaNaiHang - หาห้างใกล้คุณ

แอปพลิเคชันค้นหาห้างสรรพสินค้าและร้านค้าใกล้คุณ พร้อมการคำนวณระยะทางและข้อมูลครบถ้วน

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/your-username/hanaihang.git
cd hanaihang

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Environment Variables

สร้างไฟล์ `.env.local` และเพิ่ม:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📋 คำสั่งหลัก

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview build

# Code Quality
npm run lint         # Check code style
npm run fix          # Fix code style automatically
npm run depcheck     # Check unused dependencies
npm run tsprune      # Check unused TypeScript exports
npm run cleanup      # Run all checks

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:ui      # Run tests with UI

# Data Management
npm run enhance-search-data  # Enhance Firestore data for search
npm run seed                 # Seed initial data
```

## 🏗️ โครงสร้างโปรเจค

```
src/
├── features/           # Feature-based modules
│   ├── search/        # Search functionality
│   ├── malls/         # Mall management
│   └── stores/        # Store management
├── services/          # External services
│   ├── firebase/      # Firebase configuration
│   └── geoutils/      # Geolocation utilities
├── ui/                # Reusable UI components
├── config/            # App configuration
├── types/             # Global type definitions
├── test/              # Test files and fixtures
└── legacy/            # Deprecated code (to be removed)
```

## 📚 เอกสารเพิ่มเติม

- [Schema Documentation](./docs/schema.md) - โครงสร้างข้อมูล Firestore
- [Contributing Guide](./CONTRIBUTING.md) - แนวทางการพัฒนา
- [Search System](./SEARCH_SYSTEM_README.md) - ระบบค้นหา

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase Firestore
- **Testing**: Vitest + Playwright
- **Code Quality**: ESLint + Prettier + Husky

## 📄 License

MIT License - ดูรายละเอียดใน [LICENSE](./LICENSE) file
