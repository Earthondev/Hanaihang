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

async function normalizeTimesAndStatus() {
  console.log('🔄 Starting time and status normalization...\n');
  
  try {
    // Get all malls
    const mallsRef = collection(db, 'malls');
    const q = query(mallsRef, orderBy('displayName'));
    const mallsSnap = await getDocs(q);
    
    console.log(`📊 Found ${mallsSnap.docs.length} malls to process\n`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const mallDoc of mallsSnap.docs) {
      try {
        const mallId = mallDoc.id;
        const mallData = mallDoc.data();
        const mallName = mallData.displayName || mallData.name || 'Unknown';
        
        console.log(`${processedCount + 1}. Processing: ${mallName} (${mallId})`);
        
        let needsUpdate = false;
        const updateData = {};
        
        // Check and normalize status
        if (!mallData.status) {
          updateData.status = 'Active';
          needsUpdate = true;
          console.log(`   📝 Adding status: Active`);
        }
        
        // Check and normalize hours
        const hasHours = mallData.hours && (mallData.hours.open || mallData.hours.close);
        const hasOpenCloseTime = mallData.openTime && mallData.closeTime;
        
        if (!hasHours && !hasOpenCloseTime) {
          // No time data, add default hours
          updateData.hours = {
            open: '10:00',
            close: '22:00'
          };
          needsUpdate = true;
          console.log(`   📝 Adding default hours: 10:00-22:00`);
        } else if (hasHours && hasOpenCloseTime) {
          // Has both, remove openTime/closeTime (exclusive rule)
          updateData.openTime = null;
          updateData.closeTime = null;
          needsUpdate = true;
          console.log(`   📝 Removing openTime/closeTime (keeping hours)`);
        } else if (hasOpenCloseTime && !hasHours) {
          // Convert openTime/closeTime to hours format
          updateData.hours = {
            open: mallData.openTime,
            close: mallData.closeTime
          };
          updateData.openTime = null;
          updateData.closeTime = null;
          needsUpdate = true;
          console.log(`   📝 Converting openTime/closeTime to hours format`);
        }
        
        // Ensure slug field exists
        if (!mallData.slug && mallData.name) {
          updateData.slug = mallData.name;
          needsUpdate = true;
          console.log(`   📝 Adding slug: ${mallData.name}`);
        }
        
        // Update if needed
        if (needsUpdate) {
          await setDoc(doc(db, 'malls', mallId), {
            ...updateData,
            updatedAt: new Date()
          }, { merge: true });
          
          updatedCount++;
          console.log(`   ✅ Updated successfully`);
        } else {
          console.log(`   ✅ No updates needed`);
        }
        
        processedCount++;
        console.log('');
        
      } catch (error) {
        console.error(`   ❌ Error processing mall ${mallDoc.id}:`, error.message);
        errorCount++;
        console.log(`   ⏭️  Continuing with next mall...\n`);
      }
    }
    
    console.log('🎉 Time and status normalization completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully processed: ${processedCount} malls`);
    console.log(`   📝 Updated: ${updatedCount} malls`);
    console.log(`   ❌ Errors: ${errorCount} malls`);
    
  } catch (error) {
    console.error('❌ Fatal error during normalization:', error.message);
    process.exit(1);
  }
}

// Run the script
normalizeTimesAndStatus().catch(console.error);
