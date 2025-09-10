// Script to backfill denormalized data for stores
// Run with: node scripts/backfill-store-denorm.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, getDocs, collection, doc, writeBatch } from "firebase/firestore";

// Firebase config
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

// Cache for malls and floors
const mallCache = new Map();
const floorCache = new Map();

/**
 * Get mall data with caching
 */
async function getMall(mallId) {
  if (mallCache.has(mallId)) {
    return mallCache.get(mallId);
  }
  
  try {
    const mallDoc = await getDocs(collection(db, "malls"));
    const mall = mallDoc.docs.find(doc => doc.id === mallId);
    const mallData = mall ? { id: mall.id, ...mall.data() } : null;
    
    mallCache.set(mallId, mallData);
    return mallData;
  } catch (error) {
    console.error(`Error fetching mall ${mallId}:`, error);
    return null;
  }
}

/**
 * Get floor data with caching
 */
async function getFloorInfo(mallId, floorId) {
  const cacheKey = `${mallId}-${floorId}`;
  if (floorCache.has(cacheKey)) {
    return floorCache.get(cacheKey);
  }
  
  try {
    const floorsCol = collection(db, "malls", mallId, "floors");
    const floorsSnap = await getDocs(floorsCol);
    const floors = floorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const floor = floors.find(f => f.id === floorId || f.label === floorId);
    
    floorCache.set(cacheKey, floor);
    return floor;
  } catch (error) {
    console.error(`Error fetching floor ${floorId} for mall ${mallId}:`, error);
    return null;
  }
}

/**
 * Main backfill function
 */
async function run() {
  console.log('🚀 Starting store denormalization backfill...');
  
  try {
    // Get all stores
    const storesSnap = await getDocs(collection(db, "stores"));
    console.log(`📊 Found ${storesSnap.docs.length} stores to process`);
    
    const batch = writeBatch(db);
    let count = 0;
    let updatedCount = 0;
    
    for (const storeDoc of storesSnap.docs) {
      const store = storeDoc.data();
      const storeId = storeDoc.id;
      
      if (!store.mallId) {
        console.log(`⚠️  Store ${storeId} has no mallId, skipping`);
        continue;
      }
      
      const update = {};
      let needsUpdate = false;
      
      // Get mall data
      const mall = await getMall(store.mallId);
      if (mall) {
        const mallCoords = mall.location ?? mall.coords ?? null;
        
        // Add mallCoords if missing
        if (mallCoords && !store.mallCoords) {
          update.mallCoords = mallCoords;
          needsUpdate = true;
        }
        
        // Add mallSlug if missing
        if (mall.name && !store.mallSlug) {
          update.mallSlug = mall.name;
          needsUpdate = true;
        }
      }
      
      // Get floor data
      if (store.floorId) {
        const floor = await getFloorInfo(store.mallId, store.floorId);
        if (floor && !store.floorLabel) {
          update.floorLabel = floor.name ?? floor.label;
          needsUpdate = true;
        }
      }
      
      // Update store if needed
      if (needsUpdate) {
        batch.update(doc(db, "stores", storeId), update);
        updatedCount++;
        
        console.log(`✅ Updated store ${storeId}:`, update);
      }
      
      count++;
      
      // Commit batch every 400 operations to avoid batch size limits
      if (count % 400 === 0) {
        await batch.commit();
        console.log(`📦 Committed batch at ${count} stores`);
      }
    }
    
    // Commit remaining operations
    if (count % 400 !== 0) {
      await batch.commit();
    }
    
    console.log('🎉 Backfill completed!');
    console.log(`📊 Processed: ${count} stores`);
    console.log(`✅ Updated: ${updatedCount} stores`);
    console.log(`💾 Cache stats: ${mallCache.size} malls, ${floorCache.size} floors`);
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Run the script
run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
