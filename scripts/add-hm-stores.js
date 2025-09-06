import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

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

// H&M stores data with mall mapping
const hmStores = [
  {
    "name": "H&M Siam Paragon",
    "mallName": "Siam Paragon",
    "category": "Fashion",
    "floorId": "2",
    "unit": "",
    "phone": "063-195-1661",
    "hours": "10:00-22:00",
    "status": "Active"
  },
  {
    "name": "H&M CentralWorld",
    "mallName": "CentralWorld",
    "category": "Fashion",
    "floorId": "1",
    "unit": "F101-117",
    "phone": "02-646-1077",
    "hours": "10:00-22:00",
    "status": "Active"
  },
  {
    "name": "H&M ICONSIAM",
    "mallName": "ICONSIAM",
    "category": "Fashion",
    "floorId": "1",
    "unit": "",
    "phone": "",
    "hours": "10:00-22:00",
    "status": "Active"
  },
  {
    "name": "H&M Terminal 21 Asok",
    "mallName": "Terminal 21 Asok",
    "category": "Fashion",
    "floorId": "M",
    "unit": "SH-M-045",
    "phone": "02-106-4578",
    "hours": "10:00-22:00",
    "status": "Active"
  },
  {
    "name": "H&M EmQuartier",
    "mallName": "EmQuartier",
    "category": "Fashion",
    "floorId": "1",
    "unit": "1B03-06, 1C06",
    "phone": "02-610-6738",
    "hours": "10:00-22:00",
    "status": "Active"
  },
  {
    "name": "H&M Central Plaza Grand Rama 9",
    "mallName": "Central Plaza Grand Rama 9",
    "category": "Fashion",
    "floorId": "2",
    "unit": "",
    "phone": "",
    "hours": "10:00-22:00",
    "status": "Active"
  },
  {
    "name": "H&M The Mall Bangkapi",
    "mallName": "The Mall Bangkapi",
    "category": "Fashion",
    "floorId": "1",
    "unit": "",
    "phone": "02-704-7688",
    "hours": "11:00-21:00",
    "status": "Active"
  },
  {
    "name": "H&M The Mall Bangkae",
    "mallName": "The Mall Bangkae",
    "category": "Fashion",
    "floorId": "1",
    "unit": "",
    "phone": "02-567-5434",
    "hours": "11:00-21:00",
    "status": "Active"
  },
  {
    "name": "H&M Central Chaeng Wattana",
    "mallName": "Central Chaeng Wattana",
    "category": "Fashion",
    "floorId": "1",
    "unit": "",
    "phone": "02-118-3402",
    "hours": "11:00-21:00",
    "status": "Active"
  },
  {
    "name": "H&M Central Plaza Bangna",
    "mallName": "Central Plaza Bangna",
    "category": "Fashion",
    "floorId": "1",
    "unit": "",
    "phone": "",
    "hours": "10:30-21:00",
    "status": "Active"
  }
];

// Function to find mall by display name
async function findMallByName(mallName) {
  try {
    const mallsRef = collection(db, 'malls');
    const q = query(mallsRef, where('displayName', '==', mallName));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`❌ ไม่พบห้าง: ${mallName}`);
      return null;
    }
    
    const mallDoc = querySnapshot.docs[0];
    return {
      id: mallDoc.id,
      ...mallDoc.data()
    };
  } catch (error) {
    console.error(`❌ Error finding mall ${mallName}:`, error);
    return null;
  }
}

// Function to add H&M stores
async function addHmStores() {
  try {
    console.log('🚀 เริ่มต้นเพิ่มร้าน H&M เข้า Firebase...');
    
    // Get all malls first to see what's available
    console.log('📋 ตรวจสอบห้างที่มีอยู่ในระบบ...');
    const mallsRef = collection(db, 'malls');
    const mallsSnapshot = await getDocs(mallsRef);
    
    if (mallsSnapshot.empty) {
      console.log('❌ ไม่มีห้างในระบบ กรุณาเพิ่มห้างก่อน');
      return;
    }
    
    console.log('🏢 ห้างที่มีอยู่ในระบบ:');
    const availableMalls = [];
    mallsSnapshot.forEach(doc => {
      const mall = doc.data();
      if (mall.displayName) {
        console.log(`- ${mall.displayName} (ID: ${doc.id})`);
        availableMalls.push({ id: doc.id, displayName: mall.displayName });
      }
    });
    
    const storesRef = collection(db, 'stores');
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const store of hmStores) {
      console.log(`\n🔄 กำลังเพิ่มร้าน: ${store.name}`);
      
      // Find the mall
      const mall = await findMallByName(store.mallName);
      if (!mall) {
        console.log(`⏭️ ข้ามร้าน ${store.name} - ไม่พบห้าง ${store.mallName}`);
        skippedCount++;
        continue;
      }
      
      // Prepare store data
      const storeData = {
        name: store.name,
        nameLower: store.name.toLowerCase(),
        brandSlug: 'hm', // H&M brand slug
        category: store.category,
        floorId: store.floorId,
        unit: store.unit || null,
        phone: store.phone || null,
        hours: store.hours || null,
        status: store.status,
        mallId: mall.id,
        mallSlug: mall.name || mall.displayName?.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Generate a unique ID for the store
      const storeId = `hm_${mall.id}_${store.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}_${Date.now()}`;
      
      // Check if store already exists
      const existingStoreQuery = query(
        storesRef, 
        where('name', '==', store.name),
        where('mallId', '==', mall.id)
      );
      const existingStoreSnapshot = await getDocs(existingStoreQuery);
      
      if (!existingStoreSnapshot.empty) {
        console.log(`⏭️ ข้ามร้าน ${store.name} - มีอยู่แล้วในระบบ`);
        skippedCount++;
        continue;
      }
      
      // Add store to database
      await setDoc(doc(storesRef, storeId), storeData);
      console.log(`✅ เพิ่มร้าน: ${store.name} ในห้าง ${mall.displayName} (ชั้น ${store.floorId})`);
      addedCount++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 เสร็จสิ้นการเพิ่มร้าน H&M:`);
    console.log(`✅ เพิ่มสำเร็จ: ${addedCount} ร้าน`);
    console.log(`⏭️ ข้าม: ${skippedCount} ร้าน`);
    
  } catch (error) {
    console.error('❌ Error adding H&M stores:', error);
  }
}

// Run the script
addHmStores();
