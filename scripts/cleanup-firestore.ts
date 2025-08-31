import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  writeBatch,
  query,
  where 
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to create slug from display name
function toSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper function to normalize text for search
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

// Helper function to generate search keywords for malls
function generateMallKeywords(displayName: string, name: string): string[] {
  const keywords = new Set<string>();
  
  // Add original names
  keywords.add(displayName.toLowerCase());
  keywords.add(name.toLowerCase());
  
  // Add common variations
  const variations = [
    displayName.replace(/\s+/g, ''),
    displayName.replace(/\s+/g, '-'),
    displayName.replace(/\s+/g, '').toLowerCase(),
    displayName.replace(/\s+/g, '-').toLowerCase(),
  ];
  
  variations.forEach(v => keywords.add(v));
  
  // Add Thai number variations (if applicable)
  if (displayName.includes('3')) {
    keywords.add(displayName.replace('3', 'iii').toLowerCase());
    keywords.add(displayName.replace('3', 'สาม').toLowerCase());
  }
  
  return Array.from(keywords);
}

// Helper function to generate brand slug from store name
function generateBrandSlug(storeName: string): string {
  // Common brand mappings
  const brandMappings: { [key: string]: string } = {
    'uniqlo': 'uniqlo',
    'ยูนิโคล่': 'uniqlo',
    'zara': 'zara',
    'ซาร่า': 'zara',
    'h&m': 'h-m',
    'h&m home': 'h-m',
    'nike': 'nike',
    'ไนกี้': 'nike',
    'adidas': 'adidas',
    'อาดิดาส': 'adidas',
    'starbucks': 'starbucks',
    'สตาร์บัคส์': 'starbucks',
    'mcdonalds': 'mcdonalds',
    'แมคโดนัลด์': 'mcdonalds',
    'kfc': 'kfc',
    'เคเอฟซี': 'kfc',
    'central': 'central',
    'เซ็นทรัล': 'central',
    'the mall': 'the-mall',
    'เดอะมอลล์': 'the-mall',
    'siam paragon': 'siam-paragon',
    'สยามพารากอน': 'siam-paragon',
    'iconsiam': 'iconsiam',
    'ไอคอนสยาม': 'iconsiam'
  };
  
  const normalizedName = storeName.toLowerCase().trim();
  
  // Check if we have a direct mapping
  if (brandMappings[normalizedName]) {
    return brandMappings[normalizedName];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(brandMappings)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }
  
  // Fallback to slug generation
  return toSlug(storeName);
}

// Function to clean up mall data
async function cleanupMallData() {
  console.log('🔄 Starting mall data cleanup...');
  
  try {
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    const batch = writeBatch(db);
    let updateCount = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const mallData = mallDoc.data();
      const updates: any = {};
      
      // Fix undefined displayName
      if (!mallData.displayName && mallData.name) {
        updates.displayName = mallData.name
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      // Add nameLower if missing
      if (!mallData.nameLower && mallData.displayName) {
        updates.nameLower = normalizeText(mallData.displayName);
      }
      
      // Add searchKeywords if missing
      if (!mallData.searchKeywords && mallData.displayName) {
        updates.searchKeywords = generateMallKeywords(mallData.displayName, mallData.name);
      }
      
      // Add status if missing
      if (!mallData.status) {
        updates.status = 'Active';
      }
      
      // Add storeCount if missing
      if (mallData.storeCount === undefined) {
        updates.storeCount = 0;
      }
      
      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        batch.update(mallDoc.ref, updates);
        updateCount++;
        console.log(`✅ Cleaned mall: ${mallData.displayName || mallData.name}`);
      }
    }
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully cleaned ${updateCount} malls`);
    } else {
      console.log('ℹ️ No mall cleanup needed');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning mall data:', error);
    throw error;
  }
}

// Function to clean up store data
async function cleanupStoreData() {
  console.log('🔄 Starting store data cleanup...');
  
  try {
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    let totalUpdateCount = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const mallData = mallDoc.data();
      const storesSnapshot = await getDocs(collection(db, 'malls', mallDoc.id, 'stores'));
      
      if (storesSnapshot.empty) continue;
      
      const batch = writeBatch(db);
      let updateCount = 0;
      
      for (const storeDoc of storesSnapshot.docs) {
        const storeData = storeDoc.data();
        const updates: any = {};
        
        // Fix undefined store name
        if (!storeData.name) {
          updates.name = `Store ${storeDoc.id}`;
        }
        
        // Add nameLower if missing
        if (!storeData.nameLower && storeData.name) {
          updates.nameLower = normalizeText(storeData.name);
        }
        
        // Add brandSlug if missing
        if (!storeData.brandSlug && storeData.name) {
          updates.brandSlug = generateBrandSlug(storeData.name);
        }
        
        // Add mallId and mallSlug if missing
        if (!storeData.mallId) {
          updates.mallId = mallDoc.id;
        }
        if (!storeData.mallSlug) {
          updates.mallSlug = mallData.name;
        }
        
        // Add location info if missing (use mall coordinates)
        if (!storeData.location && mallData.coords) {
          updates.location = {
            lat: mallData.coords.lat,
            lng: mallData.coords.lng
          };
        }
        
        // Update if there are changes
        if (Object.keys(updates).length > 0) {
          batch.update(storeDoc.ref, updates);
          updateCount++;
        }
      }
      
      if (updateCount > 0) {
        await batch.commit();
        totalUpdateCount += updateCount;
        console.log(`✅ Cleaned ${updateCount} stores in ${mallData.displayName}`);
      }
    }
    
    if (totalUpdateCount > 0) {
      console.log(`✅ Successfully cleaned ${totalUpdateCount} stores total`);
    } else {
      console.log('ℹ️ No store cleanup needed');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning store data:', error);
    throw error;
  }
}

// Function to remove duplicate stores
async function removeDuplicateStores() {
  console.log('🔄 Checking for duplicate stores...');
  
  try {
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    let totalRemoved = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const storesSnapshot = await getDocs(collection(db, 'malls', mallDoc.id, 'stores'));
      const stores = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Group stores by brandSlug
      const storeGroups: { [key: string]: any[] } = {};
      stores.forEach(store => {
        const key = store.brandSlug || store.name.toLowerCase();
        if (!storeGroups[key]) {
          storeGroups[key] = [];
        }
        storeGroups[key].push(store);
      });
      
      // Remove duplicates (keep the first one)
      const batch = writeBatch(db);
      let removedCount = 0;
      
      for (const [brandSlug, storeGroup] of Object.entries(storeGroups)) {
        if (storeGroup.length > 1) {
          // Keep the first store, remove the rest
          for (let i = 1; i < storeGroup.length; i++) {
            batch.delete(doc(db, 'malls', mallDoc.id, 'stores', storeGroup[i].id));
            removedCount++;
          }
          console.log(`🗑️ Removed ${storeGroup.length - 1} duplicate stores for ${brandSlug} in ${mallDoc.data().displayName}`);
        }
      }
      
      if (removedCount > 0) {
        await batch.commit();
        totalRemoved += removedCount;
      }
    }
    
    if (totalRemoved > 0) {
      console.log(`✅ Removed ${totalRemoved} duplicate stores total`);
    } else {
      console.log('ℹ️ No duplicate stores found');
    }
    
  } catch (error) {
    console.error('❌ Error removing duplicate stores:', error);
    throw error;
  }
}

// Function to update store counts
async function updateStoreCounts() {
  console.log('🔄 Updating store counts...');
  
  try {
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    const batch = writeBatch(db);
    let updateCount = 0;
    
    for (const mallDoc of mallsSnapshot.docs) {
      const storesSnapshot = await getDocs(collection(db, 'malls', mallDoc.id, 'stores'));
      const storeCount = storesSnapshot.size;
      
      batch.update(mallDoc.ref, { storeCount });
      updateCount++;
    }
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Updated store counts for ${updateCount} malls`);
    }
    
  } catch (error) {
    console.error('❌ Error updating store counts:', error);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Firestore cleanup process...');
  
  try {
    // Step 1: Clean up mall data
    await cleanupMallData();
    
    // Step 2: Clean up store data
    await cleanupStoreData();
    
    // Step 3: Remove duplicate stores
    await removeDuplicateStores();
    
    // Step 4: Update store counts
    await updateStoreCounts();
    
    console.log('✅ Firestore cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Firestore cleanup failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export {
  cleanupMallData,
  cleanupStoreData,
  removeDuplicateStores,
  updateStoreCounts
};
