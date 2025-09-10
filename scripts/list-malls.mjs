#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Firebase config from service account
const serviceAccountPath = join(__dirname, '..', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase
const app = initializeApp({
  projectId: serviceAccount.project_id,
  // Add other config if needed
});

const db = getFirestore(app);

async function listMalls() {
  try {
    console.log('🔍 กำลังดึงรายชื่อห้างจาก Firestore...\n');
    
    const mallsRef = collection(db, 'malls');
    const q = query(mallsRef, orderBy('displayName'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ ไม่พบห้างในระบบ');
      return;
    }
    
    console.log(`📊 พบห้างทั้งหมด: ${snapshot.docs.length} แห่ง\n`);
    console.log('=' .repeat(80));
    console.log('รายชื่อห้างสรรพสินค้า');
    console.log('=' .repeat(80));
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.displayName || data.name || 'ไม่ระบุชื่อ'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   ชื่อ Slug: ${data.name || 'ไม่ระบุ'}`);
      console.log(`   ที่อยู่: ${data.address || 'ไม่ระบุ'}`);
      console.log(`   เขต: ${data.district || 'ไม่ระบุ'}`);
      console.log(`   เบอร์โทร: ${data.contact?.phone || 'ไม่ระบุ'}`);
      console.log(`   เวลาเปิด-ปิด: ${data.hours?.open || 'ไม่ระบุ'} - ${data.hours?.close || 'ไม่ระบุ'}`);
      console.log(`   สถานะ: ${data.status || 'ไม่ระบุ'}`);
      console.log(`   จำนวนร้าน: ${data.storeCount || 0} ร้าน`);
      console.log(`   จำนวนชั้น: ${data.floorCount || 0} ชั้น`);
      console.log(`   สร้างเมื่อ: ${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('th-TH') : 'ไม่ระบุ'}`);
      console.log(`   อัปเดตล่าสุด: ${data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleDateString('th-TH') : 'ไม่ระบุ'}`);
      console.log('-'.repeat(80));
    });
    
    console.log(`\n✅ ดึงข้อมูลสำเร็จ! รวม ${snapshot.docs.length} ห้าง`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  }
}

// Run the script
listMalls();
