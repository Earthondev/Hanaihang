import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// Get git info
const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
const gitShortSha = gitSha.substring(0, 7);
const buildTime = new Date().toISOString();

// Get package version
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Generate build info
const buildInfo = {
  version,
  gitSha,
  gitShortSha,
  buildTime,
  buildDate: new Date().toLocaleDateString('th-TH'),
  buildTimeLocal: new Date().toLocaleTimeString('th-TH')
};

// Write to src/build-info.ts
const buildInfoContent = `// Auto-generated build info
export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)};

export const VERSION = '${version}';
export const GIT_SHA = '${gitShortSha}';
export const BUILD_TIME = '${buildTime}';
`;

writeFileSync(join(process.cwd(), 'src', 'build-info.ts'), buildInfoContent);

console.log('✅ Build info generated:', buildInfo);
