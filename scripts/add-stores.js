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

// Function to add stores to a specific mall
async function addStoresToMall(mallName, stores) {
  try {
    console.log(`🔄 กำลังเพิ่มร้านค้าให้ห้าง: ${mallName}`);
    
    // Find the mall document
    const mallsRef = collection(db, 'malls');
    const q = query(mallsRef, where('displayName', '==', mallName));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`❌ ไม่พบห้าง: ${mallName}`);
      return;
    }
    
    const mallDoc = querySnapshot.docs[0];
    const mallId = mallDoc.id;
    console.log(`✅ พบห้าง: ${mallName} (ID: ${mallId})`);
    
    // Add stores to the mall
    const storesRef = collection(db, 'stores');
    let addedCount = 0;
    
    for (const store of stores) {
      const storeData = {
        ...store,
        mallId: mallId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Generate a unique ID for the store
      const storeId = `${mallId}_${store.name.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await setDoc(doc(storesRef, storeId), storeData);
      console.log(`✅ เพิ่มร้าน: ${store.name} (${store.floor})`);
      addedCount++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 เพิ่มร้านค้าเสร็จสิ้น: ${addedCount} ร้าน ในห้าง ${mallName}`);
    
  } catch (error) {
    console.error(`❌ Error adding stores to ${mallName}:`, error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 เริ่มต้นเพิ่มร้านค้าเข้า Firebase...');
    
    // ข้อมูลร้านค้าจะถูกเพิ่มที่นี่
    // คุณสามารถแก้ไขข้อมูลในส่วนนี้
    
    // ตัวอย่าง: เพิ่มร้านค้าให้ Central Rama 3
    const centralRama3Stores = [
      {
        name: "Zara",
        floor: "1",
        category: "Fashion",
        unit: "1-22",
        phone: "02-000-0000",
        hours: "10:00-22:00",
        status: "Active"
      },
      {
        name: "H&M",
        floor: "1", 
        category: "Fashion",
        unit: "1-23",
        phone: "02-000-0001",
        hours: "10:00-22:00",
        status: "Active"
      }
    ];
    
    // เพิ่มร้านค้า
    await addStoresToMall("Central Rama 3", centralRama3Stores);
    
    console.log('✅ เสร็จสิ้นการเพิ่มร้านค้า');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
main();
