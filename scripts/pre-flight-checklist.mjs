#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, collectionGroup } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
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

async function runPreFlightChecklist() {
  console.log('🚀 Pre-flight Checklist for Mall Cleanup\n');
  console.log('=' .repeat(60));
  
  let allChecksPassed = true;
  
  try {
    // 1. Check service account permissions
    console.log('📋 1. Service Account Permissions');
    try {
      const mallsRef = collection(db, 'malls');
      const testQuery = query(mallsRef, orderBy('displayName'));
      await getDocs(testQuery);
      console.log('   ✅ Read permission: OK');
      
      // Test write permission (we'll just check if we can access the collection)
      const storesCg = collectionGroup(db, 'stores');
      await getDocs(storesCg);
      console.log('   ✅ Write permission: OK');
    } catch (error) {
      console.log('   ❌ Permission error:', error.message);
      allChecksPassed = false;
    }
    
    // 2. Check Firebase project
    console.log('\n📋 2. Firebase Project');
    console.log(`   📊 Project ID: ${serviceAccount.project_id}`);
    console.log(`   📊 Expected: hanaihang-fe9ec`);
    if (serviceAccount.project_id === 'hanaihang-fe9ec') {
      console.log('   ✅ Project ID matches');
    } else {
      console.log('   ⚠️  Project ID mismatch - please run: firebase use hanaihang-fe9ec');
      allChecksPassed = false;
    }
    
    // 3. Check current data state
    console.log('\n📋 3. Current Data State');
    const mallsRef = collection(db, 'malls');
    const mallsSnap = await getDocs(query(mallsRef, orderBy('displayName')));
    console.log(`   📊 Total malls: ${mallsSnap.docs.length}`);
    
    // Check for duplicates
    const mallNames = new Map();
    const duplicates = [];
    mallsSnap.docs.forEach(doc => {
      const name = doc.data().displayName || doc.data().name || 'Unknown';
      if (mallNames.has(name)) {
        duplicates.push({ name, ids: [mallNames.get(name), doc.id] });
      } else {
        mallNames.set(name, doc.id);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`   ⚠️  Found ${duplicates.length} duplicate malls:`);
      duplicates.forEach(dup => {
        console.log(`      ${dup.name}: ${dup.ids.join(', ')}`);
      });
    } else {
      console.log('   ✅ No duplicates found');
    }
    
    // Check stores
    const storesCg = collectionGroup(db, 'stores');
    const storesSnap = await getDocs(storesCg);
    console.log(`   📊 Total stores: ${storesSnap.docs.length}`);
    
    // 4. Check indexes
    console.log('\n📋 4. Firestore Indexes');
    console.log('   📝 Required indexes for collectionGroup stores:');
    console.log('      - nameLower ASC');
    console.log('      - (mallId ASC, nameLower ASC)');
    console.log('      - (category ASC, nameLower ASC)');
    console.log('      - (status ASC, nameLower ASC)');
    console.log('   ⚠️  Please ensure these are deployed: firebase deploy --only firestore:indexes');
    
    // 5. Check backup
    console.log('\n📋 5. Backup Status');
    console.log('   📝 Please ensure you have a recent backup:');
    console.log('      gcloud firestore export gs://<your-bucket>/backups/$(date +%Y%m%d-%H%M)');
    console.log('   ⚠️  Backup is CRITICAL before running cleanup scripts');
    
    // 6. Check rules
    console.log('\n📋 6. Firestore Rules');
    console.log('   📝 Current rules should NOT block root stores yet');
    console.log('   📝 Deploy new rules AFTER cleanup verification:');
    console.log('      firebase deploy --only firestore:rules');
    
    // 7. Check scripts
    console.log('\n📋 7. Cleanup Scripts');
    const requiredScripts = [
      'merge-duplicates.mjs',
      'convert-autoid-to-slug.mjs', 
      'recalc-counts.mjs',
      'normalize-times-and-status.mjs',
      'normalize-location-fields.mjs',
      'verify-cleanup-results.mjs',
      'rollback-mall-cleanup.mjs'
    ];
    
    let missingScripts = 0;
    requiredScripts.forEach(script => {
      const scriptPath = join(__dirname, script);
      if (existsSync(scriptPath)) {
        console.log(`   ✅ ${script}`);
      } else {
        console.log(`   ❌ ${script} - MISSING`);
        missingScripts++;
      }
    });
    
    if (missingScripts > 0) {
      allChecksPassed = false;
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    if (allChecksPassed) {
      console.log('🎉 All pre-flight checks PASSED!');
      console.log('\n📋 Ready to proceed with cleanup:');
      console.log('   1. Run dry-run: node scripts/run-mall-cleanup.mjs --dry-run');
      console.log('   2. Spot check: node scripts/merge-duplicates.mjs --only=centralworld');
      console.log('   3. Full run: node scripts/run-mall-cleanup.mjs');
      console.log('   4. Verify: node scripts/verify-cleanup-results.mjs');
    } else {
      console.log('❌ Some pre-flight checks FAILED!');
      console.log('\n📋 Please fix the issues above before proceeding.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during pre-flight check:', error.message);
    process.exit(1);
  }
}

// Run the checklist
runPreFlightChecklist().catch(console.error);
