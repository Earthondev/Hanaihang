import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import admin from 'firebase-admin';

const projectRoot = process.cwd();
const reportPath = path.join(projectRoot, 'data', 'derived', 'firestore-validation.json');

if (!fs.existsSync(reportPath)) {
  console.error(`Validation report not found at ${reportPath}. Run npm run validate:firestore first.`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const hourIssues = report.issues.filter(
  (issue) => issue.collection === 'malls' && issue.field === 'hours'
);

if (hourIssues.length === 0) {
  console.log('No mall hour issues to fix.');
  process.exit(0);
}

const defaultKeyPath = path.join(projectRoot, 'service-account.json');
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(projectRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : defaultKeyPath;

if (!fs.existsSync(keyPath)) {
  console.error(`Service account not found at ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

function shouldDeleteHours(hours) {
  if (hours == null) return false;
  if (typeof hours !== 'object') return true;
  if ('_methodName' in hours) return true;
  if (!('open' in hours) || !('close' in hours)) return true;
  if (typeof hours.open !== 'string' || typeof hours.close !== 'string') return true;
  return false;
}

async function main() {
  let fixed = 0;

  for (const issue of hourIssues) {
    const mallId = issue.docId;
    const docRef = db.collection('malls').doc(mallId);
    const snap = await docRef.get();
    if (!snap.exists) continue;

    const data = snap.data();
    if (shouldDeleteHours(data.hours)) {
      await docRef.update({ hours: FieldValue.delete() });
      fixed += 1;
      console.log(`Removed invalid hours from malls/${mallId}`);
    }
  }

  console.log(`Fixed ${fixed} mall docs with invalid hours.`);
}

main().catch((error) => {
  console.error('Fix failed:', error);
  process.exit(1);
});
