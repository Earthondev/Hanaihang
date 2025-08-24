const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 กำลัง deploy Firestore rules...');

try {
  // Deploy Firestore rules
  execSync('firebase deploy --only firestore:rules', {
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  
  console.log('✅ Deploy Firestore rules สำเร็จ!');
} catch (error) {
  console.error('❌ เกิดข้อผิดพลาดในการ deploy:', error.message);
  process.exit(1);
}
