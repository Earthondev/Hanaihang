import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config จาก src/config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBxHxm6viYLXpifkewwj_JR0w9DVzQjuIs",
  authDomain: "hanaihang-fe9ec.firebaseapp.com",
  databaseURL: "https://hanaihang-fe9ec-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hanaihang-fe9ec",
  storageBucket: "hanaihang-fe9ec.firebasestorage.app",
  messagingSenderId: "373432002291",
  appId: "1:373432002291:web:87186fbe0b9e24edfbf986",
  measurementId: "G-FPBPXYFFWT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importMalls() {
  try {
    console.log('🔄 กำลังโหลดข้อมูลห้าง...');
    
    // อ่านไฟล์ JSON
    const seedPath = path.resolve(__dirname, 'malls-seed.json');
    const raw = fs.readFileSync(seedPath, 'utf-8');
    const malls = JSON.parse(raw);
    
    console.log(`📊 พบข้อมูลห้าง ${malls.length} แห่ง`);
    
    // ใช้ batch write เพื่อประสิทธิภาพ
    const batch = writeBatch(db);
    
    for (const mall of malls) {
      if (!mall.slug || !mall.location) {
        console.log(`⚠️ ข้าม ${mall.displayName} - ไม่มี slug หรือ location`);
        continue;
      }
      
      const mallRef = doc(db, 'malls', mall.slug);
      batch.set(mallRef, {
        ...mall,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      console.log(`✅ เตรียม ${mall.displayName} (${mall.slug})`);
    }
    
    // Commit batch
    await batch.commit();
    console.log(`🎉 Import สำเร็จ! เพิ่มห้าง ${malls.length} แห่ง`);
    console.log('🌐 ดูได้ที่: http://localhost:5173/');
    
  } catch (error) {
    console.error('❌ Error importing malls:', error);
    process.exit(1);
  }
}

// รันฟังก์ชัน
importMalls();
