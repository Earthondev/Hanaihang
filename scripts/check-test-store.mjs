#!/usr/bin/env node

/**
 * Script to check where the "test" store in "the mall thapra" is located
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query,
  where,
  doc,
  getDoc
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  projectId: process.env.FB_PROJECT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTestStore() {
  console.log('🔍 กำลังตรวจสอบร้าน "test" ในห้าง "the mall thapra"...');
  console.log('');

  try {
    // 1. ตรวจสอบใน top-level collection (/stores)
    console.log('📁 ตรวจสอบใน /stores (top-level):');
    const topLevelStores = collection(db, 'stores');
    const topLevelQuery = query(topLevelStores, where('name', '==', 'test'));
    const topLevelSnapshot = await getDocs(topLevelQuery);
    
    if (topLevelSnapshot.size > 0) {
      topLevelSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   ✅ พบใน /stores/${doc.id}`);
        console.log(`      - Mall ID: ${data.mallId || data.mallSlug || 'ไม่ระบุ'}`);
        console.log(`      - Mall Name: ${data.mallName || 'ไม่ระบุ'}`);
        console.log(`      - Category: ${data.category || 'ไม่ระบุ'}`);
        console.log(`      - Floor: ${data.floorId || 'ไม่ระบุ'}`);
        console.log(`      - Status: ${data.status || 'ไม่ระบุ'}`);
      });
    } else {
      console.log('   ❌ ไม่พบใน /stores');
    }
    
    console.log('');
    
    // 2. ตรวจสอบใน subcollection (/malls/the-mall-thapra/stores)
    console.log('📁 ตรวจสอบใน /malls/the-mall-thapra/stores (subcollection):');
    const subcollectionStores = collection(db, 'malls', 'the-mall-thapra', 'stores');
    const subcollectionQuery = query(subcollectionStores, where('name', '==', 'test'));
    const subcollectionSnapshot = await getDocs(subcollectionQuery);
    
    if (subcollectionSnapshot.size > 0) {
      subcollectionSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   ✅ พบใน /malls/the-mall-thapra/stores/${doc.id}`);
        console.log(`      - Mall ID: ${data.mallId || 'ไม่ระบุ'}`);
        console.log(`      - Mall Name: ${data.mallName || 'ไม่ระบุ'}`);
        console.log(`      - Category: ${data.category || 'ไม่ระบุ'}`);
        console.log(`      - Floor: ${data.floorId || 'ไม่ระบุ'}`);
        console.log(`      - Status: ${data.status || 'ไม่ระบุ'}`);
      });
    } else {
      console.log('   ❌ ไม่พบใน /malls/the-mall-thapra/stores');
    }
    
    console.log('');
    
    // 3. ตรวจสอบห้าง the-mall-thapra มีอยู่หรือไม่
    console.log('🏢 ตรวจสอบห้าง the-mall-thapra:');
    const mallDocRef = doc(db, 'malls', 'the-mall-thapra');
    const mallDoc = await getDoc(mallDocRef);
    
    if (mallDoc.exists()) {
      const data = mallDoc.data();
      console.log('   ✅ ห้าง the-mall-thapra มีอยู่');
      console.log(`      - Display Name: ${data.displayName || 'ไม่ระบุ'}`);
      console.log(`      - Address: ${data.address || 'ไม่ระบุ'}`);
      console.log(`      - District: ${data.district || 'ไม่ระบุ'}`);
      console.log(`      - Store Count: ${data.storeCount || 0}`);
    } else {
      console.log('   ❌ ห้าง the-mall-thapra ไม่มีอยู่');
    }
    
    console.log('');
    
    // 4. ตรวจสอบร้านทั้งหมดในห้าง the-mall-thapra
    console.log('📊 ร้านทั้งหมดในห้าง the-mall-thapra:');
    const allStoresInMall = await getDocs(collection(db, 'malls', 'the-mall-thapra', 'stores'));
    
    console.log(`   📈 จำนวนร้านทั้งหมด: ${allStoresInMall.size}`);
    
    if (allStoresInMall.size > 0) {
      console.log('   📋 รายชื่อร้าน:');
      allStoresInMall.docs.forEach(doc => {
        const data = doc.data();
        console.log(`      - ${data.name || 'ไม่ระบุชื่อ'} (${doc.id})`);
        console.log(`        Category: ${data.category || 'ไม่ระบุ'}, Floor: ${data.floorId || 'ไม่ระบุ'}`);
      });
    }
    
    console.log('');
    
    // 5. ตรวจสอบร้านทั้งหมดที่มีชื่อ "test" ในระบบ
    console.log('🔍 ร้านทั้งหมดที่มีชื่อ "test" ในระบบ:');
    
    // ตรวจสอบใน top-level
    const allTestStoresTop = await getDocs(query(collection(db, 'stores'), where('name', '==', 'test')));
    console.log(`   📁 ใน /stores: ${allTestStoresTop.size} ร้าน`);
    
    // ตรวจสอบใน subcollections (ต้องตรวจสอบทุกห้าง)
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    let totalTestStoresInSubcollections = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const testStoresInMall = await getDocs(query(
        collection(db, 'malls', mallDoc.id, 'stores'), 
        where('name', '==', 'test')
      ));
      
      if (testStoresInMall.size > 0) {
        totalTestStoresInSubcollections += testStoresInMall.size;
        console.log(`   📁 ใน /malls/${mallDoc.id}/stores: ${testStoresInMall.size} ร้าน`);
        testStoresInMall.docs.forEach(doc => {
          const data = doc.data();
          console.log(`      - ${data.name} (${doc.id})`);
        });
      }
    }
    
    console.log(`   📊 รวมร้าน "test" ใน subcollections: ${totalTestStoresInSubcollections} ร้าน`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the check
checkTestStore().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
