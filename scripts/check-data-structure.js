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
    console.log('🔍 ตรวจสอบโครงสร้างข้อมูลใน Firebase...\n');

    // 1. ตรวจสอบข้อมูลห้าง
    console.log('🏢 === ข้อมูลห้าง (Collection: malls) ===');
    const mallsRef = collection(db, 'malls');
    const mallsSnapshot = await getDocs(mallsRef);
    
    console.log(`📊 จำนวนห้างทั้งหมด: ${mallsSnapshot.size}`);
    
    mallsSnapshot.forEach((doc, index) => {
      const mall = doc.data();
      console.log(`\n${index + 1}. ห้าง: ${mall.displayName || 'ไม่มีชื่อ'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   ชื่อไฟล์: ${mall.name || 'ไม่มี'}`);
      console.log(`   ที่อยู่: ${mall.address || 'ไม่มี'}`);
      console.log(`   เขต: ${mall.district || 'ไม่มี'}`);
      console.log(`   เบอร์โทร: ${mall.phone || 'ไม่มี'}`);
      console.log(`   เว็บไซต์: ${mall.website || 'ไม่มี'}`);
      console.log(`   พิกัด: ${mall.coords ? `lat: ${mall.coords.lat}, lng: ${mall.coords.lng}` : 'ไม่มี'}`);
      console.log(`   เวลาทำการ: ${mall.hours ? `${mall.hours.open}-${mall.hours.close}` : 'ไม่มี'}`);
      console.log(`   สร้างเมื่อ: ${mall.createdAt ? mall.createdAt.toDate() : 'ไม่มี'}`);
      console.log(`   อัปเดตเมื่อ: ${mall.updatedAt ? mall.updatedAt.toDate() : 'ไม่มี'}`);
    });

    // 2. ตรวจสอบข้อมูลร้านค้า
    console.log('\n🛍️ === ข้อมูลร้านค้า (Collection: stores) ===');
    const storesRef = collection(db, 'stores');
    const storesSnapshot = await getDocs(storesRef);
    
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
