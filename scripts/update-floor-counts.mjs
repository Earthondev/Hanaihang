// Script to update floorCount for existing malls
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

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

async function updateFloorCounts() {
  try {
    console.log('🔄 Starting floor count update...');
    
    // Get all malls
    const mallsQuery = query(collection(db, 'malls'), orderBy('displayName'));
    const mallsSnapshot = await getDocs(mallsQuery);
    
    console.log(`📊 Found ${mallsSnapshot.size} malls`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const mallId = mallDoc.id;
      const mallData = mallDoc.data();
      
      try {
        // Get floors for this mall
        const floorsQuery = query(collection(db, 'malls', mallId, 'floors'), orderBy('order'));
        const floorsSnapshot = await getDocs(floorsQuery);
        
        const floorCount = floorsSnapshot.size;
        const currentFloorCount = mallData.floorCount || 0;
        
        if (floorCount !== currentFloorCount) {
          // Update mall with new floor count
          await updateDoc(doc(db, 'malls', mallId), {
            floorCount: floorCount,
            updatedAt: serverTimestamp()
          });
          
          console.log(`✅ Updated ${mallData.displayName}: ${currentFloorCount} → ${floorCount} floors`);
          updatedCount++;
        } else {
          console.log(`⏭️  Skipped ${mallData.displayName}: already has ${floorCount} floors`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${mallData.displayName}:`, error.message);
      }
    }
    
    console.log(`🎉 Completed!`);
    console.log(`✅ Updated: ${updatedCount} malls`);
    console.log(`⏭️  Skipped: ${skippedCount} malls`);
    console.log(`📊 Total processed: ${mallsSnapshot.size} malls`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
console.log('🚀 Starting floor count update script...');
updateFloorCounts().then(() => {
  console.log('✨ Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
