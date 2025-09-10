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

// District mapping for Bangkok
const districtMapping = {
  'Bangkok': 'กรุงเทพมหานคร',
  'Chatuchak': 'จตุจักร',
  'Pathum Wan': 'ปทุมวัน',
  'Watthana': 'วัฒนา',
  'Khlong Toei': 'คลองเตย',
  'Bang Kapi': 'บางกะปิ',
  'Bang Khen': 'บางเขน',
  'Bang Khun Thian': 'บางขุนเทียน',
  'Bang Phlat': 'บางพลัด',
  'Bang Yai': 'บางใหญ่',
  'Huai Khwang': 'ห้วยขวาง',
  'Lat Phrao': 'ลาดพร้าว',
  'Prawet': 'ประเวศ',
  'Yan Nawa': 'ยานนาวา',
  'Khlong San': 'คลองสาน',
  'Thanyaburi': 'ธัญบุรี',
  'Mueang Nonthaburi': 'เมืองนนทบุรี',
  'Bang Phli': 'บางพลี'
};

async function normalizeLocationFields() {
  console.log('🔄 Starting location fields normalization...\n');
  
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
        
        // Normalize district field
        if (mallData.district) {
          const currentDistrict = mallData.district;
          const normalizedDistrict = districtMapping[currentDistrict] || currentDistrict;
          
          if (normalizedDistrict !== currentDistrict) {
            updateData.district = normalizedDistrict;
            needsUpdate = true;
            console.log(`   📝 Normalizing district: ${currentDistrict} → ${normalizedDistrict}`);
          }
        }
        
        // Add province field if missing
        if (!mallData.province) {
          // Determine province based on district or address
          let province = 'กรุงเทพมหานคร'; // Default to Bangkok
          
          if (mallData.district) {
            const district = mallData.district;
            if (district.includes('นนทบุรี') || district.includes('Nonthaburi')) {
              province = 'นนทบุรี';
            } else if (district.includes('ปทุมธานี') || district.includes('Pathum Thani')) {
              province = 'ปทุมธานี';
            } else if (district.includes('สมุทรปราการ') || district.includes('Samut Prakan')) {
              province = 'สมุทรปราการ';
            }
          }
          
          updateData.province = province;
          needsUpdate = true;
          console.log(`   📝 Adding province: ${province}`);
        }
        
        // Normalize address format
        if (mallData.address && typeof mallData.address === 'string') {
          // Clean up address format
          let cleanAddress = mallData.address.trim();
          
          // Remove extra spaces and normalize
          cleanAddress = cleanAddress.replace(/\s+/g, ' ');
          
          if (cleanAddress !== mallData.address) {
            updateData.address = cleanAddress;
            needsUpdate = true;
            console.log(`   📝 Normalizing address format`);
          }
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
    
    console.log('🎉 Location fields normalization completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Successfully processed: ${processedCount} malls`);
    console.log(`   📝 Updated: ${updatedCount} malls`);
    console.log(`   ❌ Errors: ${errorCount} malls`);
    
  } catch (error) {
    console.error('❌ Fatal error during location normalization:', error.message);
    process.exit(1);
  }
}

// Run the script
normalizeLocationFields().catch(console.error);
