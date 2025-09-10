#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, collectionGroup } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const onlyFlag = args.find(arg => arg.startsWith('--only='));
const onlyMallId = onlyFlag ? onlyFlag.split('=')[1] : null;

if (onlyMallId) {
  console.log(`🎯 TARGET MODE - Only verifying mall: ${onlyMallId}\n`);
}

// Load Firebase config
const serviceAccountPath = join(__dirname, '..', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase
const app = initializeApp({
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

async function verifyCleanupResults() {
  console.log('🔍 Verifying mall cleanup results...\n');
  
  try {
    // 1. Check for duplicate malls
    console.log('📋 1. Checking for duplicate malls...');
    const mallsRef = collection(db, 'malls');
    const q = query(mallsRef, orderBy('displayName'));
    const mallsSnap = await getDocs(q);
    
    // Filter malls if --only flag is used
    const mallsToCheck = onlyMallId 
      ? mallsSnap.docs.filter(doc => doc.id === onlyMallId)
      : mallsSnap.docs;
    
    const mallNames = new Map();
    const duplicates = [];
    
    mallsToCheck.forEach(doc => {
      const data = doc.data();
      const name = data.displayName || data.name || 'Unknown';
      if (mallNames.has(name)) {
        duplicates.push({ name, ids: [mallNames.get(name), doc.id] });
      } else {
        mallNames.set(name, doc.id);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`   ❌ Found ${duplicates.length} duplicate malls:`);
      duplicates.forEach(dup => {
        console.log(`      ${dup.name}: ${dup.ids.join(', ')}`);
      });
    } else {
      console.log(`   ✅ No duplicate malls found`);
    }
    
    // 2. Check mallId = slug consistency
    console.log('\n📋 2. Checking mallId = slug consistency...');
    let inconsistentMalls = 0;
    
    mallsToCheck.forEach(doc => {
      const data = doc.data();
      const mallId = doc.id;
      const slug = data.slug || data.name;
      
      if (slug && mallId !== slug) {
        console.log(`   ⚠️  Inconsistent: ${mallId} (slug: ${slug})`);
        inconsistentMalls++;
      }
    });
    
    if (inconsistentMalls === 0) {
      console.log(`   ✅ All malls have consistent mallId = slug`);
    } else {
      console.log(`   ❌ Found ${inconsistentMalls} inconsistent malls`);
    }
    
    // 3. Check store.mallId consistency
    console.log('\n📋 3. Checking store.mallId consistency...');
    const storesCg = collectionGroup(db, 'stores');
    const storesSnap = await getDocs(storesCg);
    
    let inconsistentStores = 0;
    const storeMallIdMap = new Map();
    
    storesSnap.docs.forEach(doc => {
      const data = doc.data();
      const storeMallId = data.mallId;
      const pathMallId = doc.ref.path.split('/')[1]; // Extract mallId from path
      
      // Filter by --only flag if specified
      if (onlyMallId && pathMallId !== onlyMallId) {
        return;
      }
      
      if (storeMallId !== pathMallId) {
        console.log(`   ⚠️  Store ${doc.id}: mallId=${storeMallId}, path=${pathMallId}`);
        inconsistentStores++;
      }
      
      // Count stores per mall
      if (!storeMallIdMap.has(storeMallId)) {
        storeMallIdMap.set(storeMallId, 0);
      }
      storeMallIdMap.set(storeMallId, storeMallIdMap.get(storeMallId) + 1);
    });
    
    if (inconsistentStores === 0) {
      console.log(`   ✅ All stores have consistent mallId`);
    } else {
      console.log(`   ❌ Found ${inconsistentStores} inconsistent stores`);
    }
    
    // 4. Check storeCount/floorCount accuracy
    console.log('\n📋 4. Checking storeCount/floorCount accuracy...');
    let countMismatches = 0;
    
    for (const mallDoc of mallsToCheck) {
      const mallId = mallDoc.id;
      const mallData = mallDoc.data();
      const reportedStoreCount = Number(mallData.storeCount || 0);
      const reportedFloorCount = Number(mallData.floorCount || 0);
      
      // Count actual stores and floors
      const actualStoreCount = storeMallIdMap.get(mallId) || 0;
      const floorsRef = collection(db, 'malls', mallId, 'floors');
      const floorsSnap = await getDocs(floorsRef);
      const actualFloorCount = floorsSnap.docs.length;
      
      if (reportedStoreCount !== actualStoreCount || reportedFloorCount !== actualFloorCount) {
        console.log(`   ⚠️  ${mallId}: reported(${reportedStoreCount}s,${reportedFloorCount}f) vs actual(${actualStoreCount}s,${actualFloorCount}f)`);
        countMismatches++;
      }
    }
    
    if (countMismatches === 0) {
      console.log(`   ✅ All counts are accurate`);
    } else {
      console.log(`   ❌ Found ${countMismatches} count mismatches`);
    }
    
    // 5. Check required fields
    console.log('\n📋 5. Checking required fields...');
    let missingFields = 0;
    
    mallsToCheck.forEach(doc => {
      const data = doc.data();
      const mallId = doc.id;
      const missing = [];
      
      if (!data.slug && !data.name) missing.push('slug');
      if (!data.status) missing.push('status');
      if (!data.hours && !data.openTime) missing.push('hours');
      if (!data.district) missing.push('district');
      
      if (missing.length > 0) {
        console.log(`   ⚠️  ${mallId}: missing ${missing.join(', ')}`);
        missingFields++;
      }
    });
    
    if (missingFields === 0) {
      console.log(`   ✅ All malls have required fields`);
    } else {
      console.log(`   ❌ Found ${missingFields} malls with missing fields`);
    }
    
    // Summary
    console.log('\n🎯 Verification Summary:');
    console.log(`   📊 Total malls checked: ${mallsToCheck.length}`);
    console.log(`   🏪 Total stores: ${storesSnap.docs.length}`);
    console.log(`   🔍 Duplicates: ${duplicates.length}`);
    console.log(`   🔗 Inconsistent mallIds: ${inconsistentMalls}`);
    console.log(`   🏪 Inconsistent stores: ${inconsistentStores}`);
    console.log(`   📈 Count mismatches: ${countMismatches}`);
    console.log(`   📝 Missing fields: ${missingFields}`);
    
    if (duplicates.length === 0 && inconsistentMalls === 0 && inconsistentStores === 0 && countMismatches === 0 && missingFields === 0) {
      console.log('\n🎉 All verifications passed! Cleanup was successful.');
    } else {
      console.log('\n⚠️  Some issues found. Review the details above.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during verification:', error.message);
    process.exit(1);
  }
}

// Run the script
verifyCleanupResults().catch(console.error);
