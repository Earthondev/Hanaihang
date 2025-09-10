#!/usr/bin/env node

/**
 * Generate Build Information
 * Creates build metadata for deployment tracking
 * Supports both local development and Netlify deployment
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = `${process.cwd()}/public/build.json`;

function safe(cmd, fallback = 'unknown') {
  try { 
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); 
  } catch { 
    return fallback; 
  }
}

// Netlify environment variables: https://docs.netlify.com/configure-builds/environment-variables/
const NETLIFY = process.env.NETLIFY === 'true';
const commit = process.env.COMMIT_REF || safe('git rev-parse --short HEAD');
const branch = process.env.BRANCH || safe('git rev-parse --abbrev-ref HEAD');
const repoUrl = process.env.REPOSITORY_URL || 'https://github.com/Earthondev/Hanaihang';
const buildId = process.env.DEPLOY_ID || `${Date.now()}`;
const context = process.env.CONTEXT || (NETLIFY ? 'production' : 'local');
const version = process.env.npm_package_version || '0.0.0';
const timestamp = new Date().toISOString();

const payload = {
  version,
  sha: commit,
  branch,
  timestamp,
  buildId,
  context,
  repo: repoUrl,
  // Runtime information for debugging
  runtime: {
    node: process.version,
    netlify: NETLIFY,
    platform: process.platform,
    arch: process.arch
  }
};

// Ensure directory exists
mkdirSync(dirname(out), { recursive: true });

// Write build info
writeFileSync(out, JSON.stringify(payload, null, 2));

console.log(`[build-info] Generated ${out}`);
console.log(`[build-info] Version: ${version}`);
console.log(`[build-info] SHA: ${commit}`);
console.log(`[build-info] Branch: ${branch}`);
console.log(`[build-info] Context: ${context}`);
console.log(`[build-info] Build ID: ${buildId}`);
console.log(`[build-info] Netlify: ${NETLIFY}`);
