#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const onlyFlag = args.find(arg => arg.startsWith('--only='));
const onlyMallId = onlyFlag ? onlyFlag.split('=')[1] : null;

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No actual changes will be made\n');
}

if (onlyMallId) {
  console.log(`🎯 TARGET MODE - Only processing mall: ${onlyMallId}\n`);
}

// Load Firebase config
const serviceAccountPath = join(__dirname, '..', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin (we'll use client SDK for now)
const app = initializeApp({
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

// Load mapping configuration
const mappingPath = join(__dirname, 'mall-duplicate-mapping.json');
const mapping = JSON.parse(readFileSync(mappingPath, 'utf8'));

async function mergeDuplicateMalls() {
  console.log('🔄 Starting mall duplicate merge process...\n');
  
  // Filter mappings if --only flag is used
  const mappingsToProcess = onlyMallId 
    ? mapping.duplicateMappings.filter(m => m.from === onlyMallId || m.to === onlyMallId)
    : mapping.duplicateMappings;
  
  if (mappingsToProcess.length === 0) {
    console.log(`⚠️  No mappings found for mall: ${onlyMallId}`);
    return;
  }
  
  for (const { from, to, reason } of mappingsToProcess) {
    try {
      console.log(`📋 Processing: ${from} → ${to}`);
      console.log(`   Reason: ${reason}`);
      
      // Check if both malls exist
      const fromRef = doc(db, 'malls', from);
      const toRef = doc(db, 'malls', to);
      
      const fromSnap = await getDoc(fromRef);
      const toSnap = await getDoc(toRef);
      
      if (!fromSnap.exists()) {
        console.log(`   ⚠️  Source mall ${from} does not exist, skipping...`);
        continue;
      }
      
      if (!toSnap.exists()) {
        console.log(`   ⚠️  Target mall ${to} does not exist, skipping...`);
        continue;
      }
      
      console.log(`   📊 Source: ${fromSnap.data().displayName || 'Unknown'}`);
      console.log(`   📊 Target: ${toSnap.data().displayName || 'Unknown'}`);
      
      // Count floors and stores
      const floorsSnap = await getDocs(collection(db, 'malls', from, 'floors'));
      const storesSnap = await getDocs(collection(db, 'malls', from, 'stores'));
      
      console.log(`   📊 Found: ${floorsSnap.docs.length} floors, ${storesSnap.docs.length} stores`);
      
      // Guard: Check for stores without mallId
      const storesWithoutMallId = storesSnap.docs.filter(doc => !doc.data().mallId);
      if (storesWithoutMallId.length > 0) {
        console.log(`   ⚠️  Warning: ${storesWithoutMallId.length} stores missing mallId field`);
        storesWithoutMallId.forEach(doc => {
          console.log(`      Store ${doc.id}: ${doc.data().name || 'Unknown'}`);
        });
      }
      
      if (isDryRun) {
        console.log(`   🔍 DRY RUN: Would copy ${floorsSnap.docs.length} floors and ${storesSnap.docs.length} stores`);
        console.log(`   🔍 DRY RUN: Would update mallId in ${storesSnap.docs.length} stores`);
        console.log(`   🔍 DRY RUN: Would delete source mall ${from}`);
        continue;
      }
      
      // Copy floors from source to target
      console.log(`   🏢 Copying floors...`);
      let floorsCopied = 0;
      
      for (const floorDoc of floorsSnap.docs) {
        const floorData = floorDoc.data();
        await setDoc(doc(db, 'malls', to, 'floors', floorDoc.id), {
          ...floorData,
          updatedAt: new Date()
        }, { merge: true });
        floorsCopied++;
      }
      
      // Copy stores from source to target and update mallId
      console.log(`   🏪 Copying stores...`);
      let storesCopied = 0;
      
      for (const storeDoc of storesSnap.docs) {
        const storeData = storeDoc.data();
        
        // Guard: Ensure mallId is set
        if (!storeData.mallId) {
          console.log(`   ⚠️  Store ${storeDoc.id} missing mallId, setting to ${to}`);
        }
        
        await setDoc(doc(db, 'malls', to, 'stores', storeDoc.id), {
          ...storeData,
          mallId: to,
          mallSlug: to,
          updatedAt: new Date()
        }, { merge: true });
        storesCopied++;
      }
      
      // Update counts on target mall
      console.log(`   📈 Updating counts...`);
      const targetData = toSnap.data();
      const currentStoreCount = Number(targetData.storeCount || 0);
      const currentFloorCount = Number(targetData.floorCount || 0);
      
      await setDoc(toRef, {
        storeCount: currentStoreCount + storesCopied,
        floorCount: currentFloorCount + floorsCopied,
        updatedAt: new Date()
      }, { merge: true });
      
      // Delete source mall
      console.log(`   🗑️  Deleting source mall...`);
      await deleteDoc(fromRef);
      
      console.log(`   ✅ Successfully merged: ${floorsCopied} floors, ${storesCopied} stores`);
      console.log(`   ✅ New totals: ${currentStoreCount + storesCopied} stores, ${currentFloorCount + floorsCopied} floors\n`);
      
    } catch (error) {
      console.error(`   ❌ Error merging ${from} → ${to}:`, error.message);
      console.log(`   ⏭️  Continuing with next merge...\n`);
    }
  }
  
  console.log('🎉 Mall duplicate merge process completed!');
}

// Run the script
mergeDuplicateMalls().catch(console.error);
