#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Deploying Firebase Storage Rules...');

try {
  // Deploy storage rules
  execSync('firebase deploy --only storage', { stdio: 'inherit' });
  console.log('✅ Storage rules deployed successfully!');
} catch (error) {
  console.error('❌ Error deploying storage rules:', error.message);
  process.exit(1);
}
