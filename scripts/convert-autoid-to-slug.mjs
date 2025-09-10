#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
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

// Load mapping configuration
const mappingPath = join(__dirname, 'mall-duplicate-mapping.json');
const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));

async function convertAutoIdToSlug() {
  console.log('🔄 Starting autoId to slug conversion process...\n');
  
  for (const { from, to, reason } of mapping.slugMappings) {
    try {
      console.log(`📋 Converting: ${from} → ${to}`);
      console.log(`   Reason: ${reason}`);
      
      // Check if source mall exists
      const fromRef = doc(db, 'malls', from);
      const fromSnap = await getDoc(fromRef);
      
      if (!fromSnap.exists()) {
        console.log(`   ⚠️  Source mall ${from} does not exist, skipping...`);
        continue;
      }
      
      // Check if target slug already exists
      const toRef = doc(db, 'malls', to);
      const toSnap = await getDoc(toRef);
      
      if (toSnap.exists()) {
        console.log(`   ⚠️  Target slug ${to} already exists, skipping...`);
        continue;
      }
      
      const mallData = fromSnap.data();
      console.log(`   📊 Mall: ${mallData.displayName || 'Unknown'}`);
      
      // Create new mall document with slug as ID
      console.log(`   📝 Creating new mall document with slug ID...`);
      await setDoc(toRef, {
        ...mallData,
        name: to, // Set slug as name field
        slug: to, // Add explicit slug field
        updatedAt: new Date()
      });
      
      // Copy floors
      console.log(`   🏢 Copying floors...`);
      const floorsSnap = await getDocs(collection(db, 'malls', from, 'floors'));
      let floorsCopied = 0;
      
      for (const floorDoc of floorsSnap.docs) {
        const floorData = floorDoc.data();
        await setDoc(doc(db, 'malls', to, 'floors', floorDoc.id), {
          ...floorData,
          updatedAt: new Date()
        }, { merge: true });
        floorsCopied++;
      }
      
      // Copy stores and update mallId
      console.log(`   🏪 Copying stores...`);
      const storesSnap = await getDocs(collection(db, 'malls', from, 'stores'));
      let storesCopied = 0;
      
      for (const storeDoc of storesSnap.docs) {
        const storeData = storeDoc.data();
        await setDoc(doc(db, 'malls', to, 'stores', storeDoc.id), {
          ...storeData,
          mallId: to,
          mallSlug: to,
          updatedAt: new Date()
        }, { merge: true });
        storesCopied++;
      }
      
      // Update counts
      console.log(`   📈 Setting counts...`);
      await setDoc(toRef, {
        storeCount: storesCopied,
        floorCount: floorsCopied,
        updatedAt: new Date()
      }, { merge: true });
      
      // Delete original mall
      console.log(`   🗑️  Deleting original mall...`);
      await deleteDoc(fromRef);
      
      console.log(`   ✅ Successfully converted: ${floorsCopied} floors, ${storesCopied} stores`);
      console.log(`   ✅ New mall ID: ${to}\n`);
      
    } catch (error) {
      console.error(`   ❌ Error converting ${from} → ${to}:`, error.message);
      console.log(`   ⏭️  Continuing with next conversion...\n`);
    }
  }
  
  console.log('🎉 AutoId to slug conversion process completed!');
}

// Run the script
convertAutoIdToSlug().catch(console.error);
