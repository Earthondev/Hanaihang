#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Firebase config
const serviceAccountPath = join(__dirname, '..', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase
const app = initializeApp({
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

async function recalculateCounts() {
  console.log('🔄 Starting store and floor count recalculation...\n');
  
  try {
    // Get all malls
    const mallsRef = collection(db, 'malls');
    const q = query(mallsRef, orderBy('displayName'));
    const mallsSnap = await getDocs(q);
    
    console.log(`📊 Found ${mallsSnap.docs.length} malls to process\n`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const mallDoc of mallsSnap.docs) {
      try {
        const mallId = mallDoc.id;
        const mallData = mallDoc.data();
        const mallName = mallData.displayName || mallData.name || 'Unknown';
        
        console.log(`${processedCount + 1}. Processing: ${mallName} (${mallId})`);
        
        // Count stores
        const storesRef = collection(db, 'malls', mallId, 'stores');
        const storesSnap = await getDocs(storesRef);
        const storeCount = storesSnap.docs.length;
        
        // Count floors
        const floorsRef = collection(db, 'malls', mallId, 'floors');
        const floorsSnap = await getDocs(floorsRef);
        const floorCount = floorsSnap.docs.length;
        
        // Update mall document with new counts
        await setDoc(doc(db, 'malls', mallId), {
          storeCount: storeCount,
          floorCount: floorCount,
          updatedAt: new Date()
        }, { merge: true });
        
        console.log(`   📈 Stores: ${storeCount}, Floors: ${floorCount}`);
        
        // Show some store details if there are stores
        if (storeCount > 0) {
          const storeNames = storesSnap.docs.slice(0, 3).map(doc => doc.data().name || 'Unknown');
          const moreStores = storeCount > 3 ? ` (+${storeCount - 3} more)` : '';
          console.log(`   🏪 Sample stores: ${storeNames.join(', ')}${moreStores}`);
        }
        
        processedCount++;
        console.log(`   ✅ Updated successfully\n`);
        
      } catch (error) {
        console.error(`   ❌ Error processing mall ${mallDoc.id}:`, error.message);
        errorCount++;
        console.log(`   ⏭️  Continuing with next mall...\n`);
      }
    }
    
    console.log('🎉 Count recalculation completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully processed: ${processedCount} malls`);
    console.log(`   ❌ Errors: ${errorCount} malls`);
    
  } catch (error) {
    console.error('❌ Fatal error during count recalculation:', error.message);
    process.exit(1);
  }
}

// Run the script
recalculateCounts().catch(console.error);
