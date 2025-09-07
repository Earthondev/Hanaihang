#!/usr/bin/env node

/**
 * Generate Build Information
 * Creates build metadata for deployment tracking
 */

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

try {
  // Get git SHA (short)
  const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  
  // Get package version
  const packageJson = JSON.parse(execSync('cat package.json', { encoding: 'utf8' }));
  const version = packageJson.version;
  
  // Get current timestamp
  const time = new Date().toISOString();
  
  // Create build info object
  const buildInfo = {
    version,
    sha,
    time,
    timestamp: Date.now(),
    buildId: `${version}-${sha}-${Date.now()}`
  };
  
  // Write to public directory for static access
  writeFileSync('public/build.json', JSON.stringify(buildInfo, null, 2));
  
  // Also write to dist for production
  writeFileSync('dist/build.json', JSON.stringify(buildInfo, null, 2));
  
  console.log('✅ Build info generated:');
  console.log(`   Version: ${version}`);
  console.log(`   Git SHA: ${sha}`);
  console.log(`   Build Time: ${time}`);
  console.log(`   Build ID: ${buildInfo.buildId}`);
  
} catch (error) {
  console.error('❌ Error generating build info:', error.message);
  process.exit(1);
}
