// Script to update floorCount for existing malls
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';

// Firebase config (replace with your config)
const firebaseConfig = {
  // Add your Firebase config here
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
            updatedAt: new Date()
          });
          
          console.log(`✅ Updated ${mallData.displayName}: ${currentFloorCount} → ${floorCount} floors`);
          updatedCount++;
        } else {
          console.log(`⏭️  Skipped ${mallData.displayName}: already has ${floorCount} floors`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${mallData.displayName}:`, error);
      }
    }
    
    console.log(`🎉 Completed! Updated ${updatedCount} malls`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
updateFloorCounts();

