import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Firebase configuration
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

async function checkDataStructure() {
  try {
    console.log('🔍 ตรวจสอบร้าน "test" ในห้าง "the mall thapra"...\n');

    // 1. ตรวจสอบห้าง the-mall-thapra
    console.log('🏢 === ตรวจสอบห้าง the-mall-thapra ===');
    const mallDocRef = doc(db, 'malls', 'the-mall-thapra');
    const mallDoc = await getDoc(mallDocRef);
    
    if (mallDoc.exists()) {
      const mall = mallDoc.data();
      console.log(`✅ ห้าง the-mall-thapra มีอยู่`);
      console.log(`   Display Name: ${mall.displayName || 'ไม่มีชื่อ'}`);
      console.log(`   Address: ${mall.address || 'ไม่มี'}`);
      console.log(`   District: ${mall.district || 'ไม่มี'}`);
      console.log(`   Store Count: ${mall.storeCount || 0}`);
    } else {
      console.log('❌ ห้าง the-mall-thapra ไม่มีอยู่');
      return;
    }

    // 2. ตรวจสอบร้าน "test" ใน top-level collection
    console.log('\n📁 === ตรวจสอบใน /stores (top-level) ===');
    const storesRef = collection(db, 'stores');
    const storesSnapshot = await getDocs(storesRef);
    
    let testStoreFound = false;
    storesSnapshot.forEach((doc) => {
      const store = doc.data();
      if (store.name === 'test') {
        testStoreFound = true;
        console.log(`✅ พบร้าน "test" ใน /stores/${doc.id}`);
        console.log(`   Mall ID: ${store.mallId || store.mallSlug || 'ไม่ระบุ'}`);
        console.log(`   Mall Name: ${store.mallName || 'ไม่ระบุ'}`);
        console.log(`   Category: ${store.category || 'ไม่ระบุ'}`);
        console.log(`   Floor: ${store.floorId || 'ไม่ระบุ'}`);
        console.log(`   Status: ${store.status || 'ไม่ระบุ'}`);
      }
    });
    
    if (!testStoreFound) {
      console.log('❌ ไม่พบร้าน "test" ใน /stores');
    }

    // 3. ตรวจสอบร้าน "test" ใน subcollection
    console.log('\n📁 === ตรวจสอบใน /malls/the-mall-thapra/stores (subcollection) ===');
    const subcollectionRef = collection(db, 'malls', 'the-mall-thapra', 'stores');
    const subcollectionSnapshot = await getDocs(subcollectionRef);
    
    testStoreFound = false;
    subcollectionSnapshot.forEach((doc) => {
      const store = doc.data();
      if (store.name === 'test') {
        testStoreFound = true;
        console.log(`✅ พบร้าน "test" ใน /malls/the-mall-thapra/stores/${doc.id}`);
        console.log(`   Mall ID: ${store.mallId || 'ไม่ระบุ'}`);
        console.log(`   Mall Name: ${store.mallName || 'ไม่ระบุ'}`);
        console.log(`   Category: ${store.category || 'ไม่ระบุ'}`);
        console.log(`   Floor: ${store.floorId || 'ไม่ระบุ'}`);
        console.log(`   Status: ${store.status || 'ไม่ระบุ'}`);
      }
    });
    
    if (!testStoreFound) {
      console.log('❌ ไม่พบร้าน "test" ใน /malls/the-mall-thapra/stores');
    }

    // 4. แสดงร้านทั้งหมดในห้าง the-mall-thapra
    console.log('\n📊 === ร้านทั้งหมดในห้าง the-mall-thapra ===');
    console.log(`จำนวนร้านทั้งหมด: ${subcollectionSnapshot.size}`);
    
    if (subcollectionSnapshot.size > 0) {
      console.log('รายชื่อร้าน:');
      subcollectionSnapshot.forEach((doc, index) => {
        const store = doc.data();
        console.log(`   ${index + 1}. ${store.name || 'ไม่มีชื่อ'} (${doc.id})`);
        console.log(`      Category: ${store.category || 'ไม่ระบุ'}, Floor: ${store.floorId || 'ไม่ระบุ'}`);
      });
    }

    console.log('\n✅ การตรวจสอบเสร็จสิ้น');
    
    console.log(`📊 จำนวนร้านค้าทั้งหมด: ${storesSnapshot.size}`);
    
    // จัดกลุ่มร้านค้าตามห้าง
    const storesByMall = {};
    
    storesSnapshot.forEach((doc) => {
      const store = doc.data();
      const mallId = store.mallId;
      
      if (!storesByMall[mallId]) {
        storesByMall[mallId] = [];
      }
      storesByMall[mallId].push({
        id: doc.id,
        ...store
      });
    });

    // แสดงร้านค้าแยกตามห้าง
    for (const [mallId, stores] of Object.entries(storesByMall)) {
      console.log(`\n📍 ห้าง ID: ${mallId}`);
      console.log(`   จำนวนร้าน: ${stores.length} ร้าน`);
      
      stores.forEach((store, index) => {
        console.log(`   ${index + 1}. ${store.name}`);
        console.log(`      ชั้น: ${store.floor || 'ไม่มี'}`);
        console.log(`      หมวดหมู่: ${store.category || 'ไม่มี'}`);
        console.log(`      ยูนิต: ${store.unit || 'ไม่มี'}`);
        console.log(`      เบอร์โทร: ${store.phone || 'ไม่มี'}`);
        console.log(`      เวลาทำการ: ${store.hours || 'ไม่มี'}`);
        console.log(`      สถานะ: ${store.status || 'ไม่มี'}`);
        console.log(`      สร้างเมื่อ: ${store.createdAt ? store.createdAt.toDate() : 'ไม่มี'}`);
      });
    }

    // 3. แสดงโครงสร้างการเชื่อมต่อ
    console.log('\n🔗 === โครงสร้างการเชื่อมต่อ ===');
    console.log('📋 ความสัมพันธ์ระหว่างห้างและร้านค้า:');
    console.log('   - ห้าง (malls collection) ←→ ร้านค้า (stores collection)');
    console.log('   - เชื่อมต่อผ่าน: store.mallId = mall.id');
    console.log('   - 1 ห้าง สามารถมีได้หลายร้านค้า (One-to-Many)');
    
    console.log('\n📊 สรุปสถิติ:');
    console.log(`   - จำนวนห้าง: ${mallsSnapshot.size}`);
    console.log(`   - จำนวนร้านค้าทั้งหมด: ${storesSnapshot.size}`);
    console.log(`   - ห้างที่มีร้านค้า: ${Object.keys(storesByMall).length}`);
    
    // แสดงห้างที่มีร้านค้ามากที่สุด
    let maxStores = 0;
    let mallWithMostStores = '';
    
    for (const [mallId, stores] of Object.entries(storesByMall)) {
      if (stores.length > maxStores) {
        maxStores = stores.length;
        mallWithMostStores = mallId;
      }
    }
    
    if (maxStores > 0) {
      console.log(`   - ห้างที่มีร้านค้ามากที่สุด: ${mallWithMostStores} (${maxStores} ร้าน)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
checkDataStructure();
