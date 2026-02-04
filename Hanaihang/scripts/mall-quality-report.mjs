import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import admin from 'firebase-admin';

const projectRoot = process.cwd();
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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasCoords(data) {
  if (data.lat != null && data.lng != null) return true;
  if (data.coords && typeof data.coords === 'object') {
    return typeof data.coords.lat === 'number' && typeof data.coords.lng === 'number';
  }
  return false;
}

function hasHours(data) {
  if (isNonEmptyString(data.openTime) && isNonEmptyString(data.closeTime)) return true;
  if (data.hours && typeof data.hours === 'object') {
    return isNonEmptyString(data.hours.open) && isNonEmptyString(data.hours.close);
  }
  return false;
}

function hasContact(data) {
  if (data.contact && typeof data.contact === 'object') {
    return Boolean(data.contact.phone || data.contact.website || data.contact.social);
  }
  return Boolean(data.phone || data.website || data.social);
}

function scoreMall(mall, floorsCount, storesCount) {
  let score = 0;
  const total = 10;

  if (isNonEmptyString(mall.name)) score += 1;
  if (isNonEmptyString(mall.displayName)) score += 2;
  if (hasCoords(mall)) score += 2;
  if (hasHours(mall)) score += 1;
  if (isNonEmptyString(mall.district)) score += 1;
  if (isNonEmptyString(mall.province)) score += 1;
  if (hasContact(mall)) score += 1;
  if (floorsCount > 0) score += 0.5;
  if (storesCount > 0) score += 0.5;

  return Math.round((score / total) * 100);
}

async function main() {
  const mallsSnap = await db.collection('malls').get();
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      malls: mallsSnap.size,
      avgScore: 0,
      withCoords: 0,
      withHours: 0,
      withDistrict: 0,
      withProvince: 0,
      withContact: 0,
      withFloors: 0,
      withStores: 0,
    },
    malls: [],
  };

  let scoreSum = 0;

  for (const mallDoc of mallsSnap.docs) {
    const mall = mallDoc.data();
    const mallId = mallDoc.id;

    const floorsSnap = await db.collection('malls').doc(mallId).collection('floors').get();
    const storesSnap = await db.collection('malls').doc(mallId).collection('stores').get();

    const floorsCount = floorsSnap.size;
    const storesCount = storesSnap.size;

    const entry = {
      mallId,
      name: mall.name || null,
      displayName: mall.displayName || null,
      district: mall.district || null,
      province: mall.province || null,
      brandGroup: mall.brandGroup || null,
      hasCoords: hasCoords(mall),
      hasHours: hasHours(mall),
      hasContact: hasContact(mall),
      floorsCount,
      storesCount,
      score: scoreMall(mall, floorsCount, storesCount),
      missing: [],
    };

    if (!isNonEmptyString(mall.displayName)) entry.missing.push('displayName');
    if (!hasCoords(mall)) entry.missing.push('coords');
    if (!hasHours(mall)) entry.missing.push('hours');
    if (!isNonEmptyString(mall.district)) entry.missing.push('district');
    if (!isNonEmptyString(mall.province)) entry.missing.push('province');
    if (!hasContact(mall)) entry.missing.push('contact');
    if (floorsCount === 0) entry.missing.push('floors');
    if (storesCount === 0) entry.missing.push('stores');

    report.malls.push(entry);
    scoreSum += entry.score;

    if (entry.hasCoords) report.summary.withCoords += 1;
    if (entry.hasHours) report.summary.withHours += 1;
    if (entry.district) report.summary.withDistrict += 1;
    if (entry.province) report.summary.withProvince += 1;
    if (entry.hasContact) report.summary.withContact += 1;
    if (floorsCount > 0) report.summary.withFloors += 1;
    if (storesCount > 0) report.summary.withStores += 1;
  }

  report.summary.avgScore = mallsSnap.size
    ? Math.round(scoreSum / mallsSnap.size)
    : 0;

  report.malls.sort((a, b) => b.score - a.score);

  const outPath = path.join(projectRoot, 'data', 'derived', 'mall-quality-report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('Mall quality report generated');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Report written to ${outPath}`);
}

main().catch((error) => {
  console.error('Report failed:', error);
  process.exit(1);
});
