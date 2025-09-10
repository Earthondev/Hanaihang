/**
 * Script to enhance Firestore data for improved search functionality
 * Adds normalized fields and mall coordinates to stores
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { normalizeThai } from '../src/lib/thai-normalize.js';

// Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here
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

// Thai normalization function (copied from lib)
function normalizeThai(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\u0E00-\u0E7F\w\s]/g, '') // Keep only Thai, English, numbers, spaces
    .replace(/\s+/g, ' ')
    .trim();
}

async function enhanceMallsData() {
  console.log('🔄 Enhancing malls data...');
  
  try {
    const mallsRef = collection(db, 'malls');
    const mallsSnapshot = await getDocs(mallsRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    mallsSnapshot.forEach((mallDoc) => {
      const mallData = mallDoc.data();
      
      // Add normalized name field
      const normalizedName = normalizeThai(mallData.displayName || mallData.name || '');
      
      if (normalizedName && normalizedName !== mallData.name_normalized) {
        batch.update(mallDoc.ref, {
          name_normalized: normalizedName
        });
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updateCount} malls with normalized names`);
    } else {
      console.log('ℹ️ No malls needed updating');
    }
    
  } catch (error) {
    console.error('❌ Error enhancing malls data:', error);
  }
}

async function enhanceStoresData() {
  console.log('🔄 Enhancing stores data...');
  
  try {
    // First, get all malls to create a lookup map
    const mallsRef = collection(db, 'malls');
    const mallsSnapshot = await getDocs(mallsRef);
    const mallLookup = new Map();
    
    mallsSnapshot.forEach((mallDoc) => {
      const mallData = mallDoc.data();
      mallLookup.set(mallData.id, {
        name: mallData.displayName || mallData.name,
        coords: mallData.coords,
        slug: mallData.name
      });
    });
    
    // Now process stores
    const storesRef = collection(db, 'stores');
    const storesSnapshot = await getDocs(storesRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    storesSnapshot.forEach((storeDoc) => {
      const storeData = storeDoc.data();
      const updates = {};
      
      // Add normalized name field
      const normalizedName = normalizeThai(storeData.name || '');
      if (normalizedName && normalizedName !== storeData.name_normalized) {
        updates.name_normalized = normalizedName;
      }
      
      // Add mall coordinates and info
      if (storeData.mallId && mallLookup.has(storeData.mallId)) {
        const mallInfo = mallLookup.get(storeData.mallId);
        
        if (mallInfo.coords && !storeData.mallCoords) {
          updates.mallCoords = mallInfo.coords;
        }
        
        if (mallInfo.name && !storeData.mallName) {
          updates.mallName = mallInfo.name;
        }
        
        if (mallInfo.slug && !storeData.mallSlug) {
          updates.mallSlug = mallInfo.slug;
        }
      }
      
      // Add openNow field based on hours
      if (storeData.hours && !storeData.hasOwnProperty('openNow')) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        if (storeData.hours.open && storeData.hours.close) {
          const [openHour, openMin] = storeData.hours.open.split(':').map(Number);
          const [closeHour, closeMin] = storeData.hours.close.split(':').map(Number);
          
          const openTime = openHour * 60 + openMin;
          const closeTime = closeHour * 60 + closeMin;
          
          updates.openNow = currentTime >= openTime && currentTime <= closeTime;
        }
      }
      
      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        batch.update(storeDoc.ref, updates);
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updateCount} stores with enhanced data`);
    } else {
      console.log('ℹ️ No stores needed updating');
    }
    
  } catch (error) {
    console.error('❌ Error enhancing stores data:', error);
  }
}

async function createSearchIndexes() {
  console.log('🔄 Creating Firestore indexes for search...');
  
  try {
    // Note: Firestore indexes are typically created through the Firebase Console
    // or firebase.json configuration. This is just a reminder.
    
    console.log('📋 Required Firestore indexes:');
    console.log('1. malls: name_normalized (Ascending)');
    console.log('2. stores: name_normalized (Ascending)');
    console.log('3. stores: name_normalized (Ascending), openNow (Descending)');
    console.log('');
    console.log('💡 Add these to your firestore.indexes.json:');
    console.log(JSON.stringify({
      "indexes": [
        {
          "collectionGroup": "malls",
          "queryScope": "COLLECTION",
          "fields": [
            {
              "fieldPath": "name_normalized",
              "order": "ASCENDING"
            }
          ]
        },
        {
          "collectionGroup": "stores", 
          "queryScope": "COLLECTION",
          "fields": [
            {
              "fieldPath": "name_normalized",
              "order": "ASCENDING"
            }
          ]
        },
        {
          "collectionGroup": "stores",
          "queryScope": "COLLECTION", 
          "fields": [
            {
              "fieldPath": "name_normalized",
              "order": "ASCENDING"
            },
            {
              "fieldPath": "openNow",
              "order": "DESCENDING"
            }
          ]
        }
      ]
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

async function main() {
  console.log('🚀 Starting search data enhancement...');
  
  try {
    await enhanceMallsData();
    await enhanceStoresData();
    await createSearchIndexes();
    
    console.log('✅ Search data enhancement completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Deploy the Firestore indexes: firebase deploy --only firestore:indexes');
    console.log('2. Test the enhanced search functionality');
    console.log('3. Monitor search performance metrics');
    
  } catch (error) {
    console.error('❌ Enhancement failed:', error);
    process.exit(1);
  }
}

// Run the enhancement
main();
