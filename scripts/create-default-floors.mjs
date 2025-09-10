// Script to create default floors for existing malls
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';

// Firebase config for hanaihang-fe9ec project
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

// Default floors configuration
const defaultFloors = [
  { label: 'G', order: 0 },
  { label: '1', order: 1 },
  { label: '2', order: 2 },
  { label: '3', order: 3 },
  { label: '4', order: 4 },
  { label: '5', order: 5 }
];

async function createDefaultFloors(mallId, mallName) {
  try {
    const promises = defaultFloors.map(floor => 
      addDoc(collection(db, 'malls', mallId, 'floors'), {
        label: floor.label,
        order: floor.order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    );
    
    await Promise.all(promises);
    
    // Update mall with floor count
    await updateDoc(doc(db, 'malls', mallId), {
      floorCount: defaultFloors.length,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Created ${defaultFloors.length} floors for ${mallName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating floors for ${mallName}:`, error.message);
    return false;
  }
}

async function createDefaultFloorsForAllMalls() {
  try {
    console.log('🔄 Starting default floors creation...');
    
    // Get all malls
    const mallsQuery = query(collection(db, 'malls'), orderBy('displayName'));
    const mallsSnapshot = await getDocs(mallsQuery);
    
    console.log(`📊 Found ${mallsSnapshot.size} malls`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const mallId = mallDoc.id;
      const mallData = mallDoc.data();
      
      try {
        // Check if mall already has floors
        const floorsQuery = query(collection(db, 'malls', mallId, 'floors'), orderBy('order'));
        const floorsSnapshot = await getDocs(floorsQuery);
        
        if (floorsSnapshot.size === 0) {
          // Create default floors
          const success = await createDefaultFloors(mallId, mallData.displayName);
          if (success) {
            createdCount++;
          } else {
            errorCount++;
          }
        } else {
          console.log(`⏭️  Skipped ${mallData.displayName}: already has ${floorsSnapshot.size} floors`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${mallData.displayName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`🎉 Completed!`);
    console.log(`✅ Created floors for: ${createdCount} malls`);
    console.log(`⏭️  Skipped: ${skippedCount} malls`);
    console.log(`❌ Errors: ${errorCount} malls`);
    console.log(`📊 Total processed: ${mallsSnapshot.size} malls`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
console.log('🚀 Starting default floors creation script...');
createDefaultFloorsForAllMalls().then(() => {
  console.log('✨ Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});

