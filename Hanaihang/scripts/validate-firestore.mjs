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

const STORE_STATUS = new Set(['Active', 'Maintenance', 'Closed']);
const STORE_CATEGORIES = new Set([
  'Fashion',
  'Beauty',
  'Electronics',
  'Food & Beverage',
  'Sports',
  'Books',
  'Home & Garden',
  'Health & Pharmacy',
  'Entertainment',
  'Services',
  'Jewelry',
  'Watches',
  'Bags & Accessories',
  'Shoes',
  'Kids & Baby',
  'Automotive',
  'Banking',
  'Travel',
  'Education',
  'Fitness',
]);

const report = {
  summary: {
    malls: 0,
    floors: 0,
    stores: 0,
    issues: 0,
    errors: 0,
    warnings: 0,
  },
  issues: [],
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function addIssue({
  severity,
  collection,
  docId,
  field,
  message,
  path,
}) {
  report.issues.push({ severity, collection, docId, field, message, path });
  report.summary.issues += 1;
  if (severity === 'error') report.summary.errors += 1;
  if (severity === 'warning') report.summary.warnings += 1;
}

function validateMall(mallId, data) {
  if (!isNonEmptyString(data.name)) {
    addIssue({
      severity: 'error',
      collection: 'malls',
      docId: mallId,
      field: 'name',
      message: 'Missing or invalid mall name (slug).',
      path: `malls/${mallId}`,
    });
  }

  if (!isNonEmptyString(data.displayName)) {
    addIssue({
      severity: 'warning',
      collection: 'malls',
      docId: mallId,
      field: 'displayName',
      message: 'Missing displayName.',
      path: `malls/${mallId}`,
    });
  }

  if (data.lat != null && !isNumber(data.lat)) {
    addIssue({
      severity: 'error',
      collection: 'malls',
      docId: mallId,
      field: 'lat',
      message: 'lat must be a number if provided.',
      path: `malls/${mallId}`,
    });
  }

  if (data.lng != null && !isNumber(data.lng)) {
    addIssue({
      severity: 'error',
      collection: 'malls',
      docId: mallId,
      field: 'lng',
      message: 'lng must be a number if provided.',
      path: `malls/${mallId}`,
    });
  }

  if (data.coords != null) {
    const coords = data.coords;
    if (typeof coords !== 'object' || coords == null) {
      addIssue({
        severity: 'error',
        collection: 'malls',
        docId: mallId,
        field: 'coords',
        message: 'coords must be an object with lat/lng.',
        path: `malls/${mallId}`,
      });
    } else {
      if (!isNumber(coords.lat) || !isNumber(coords.lng)) {
        addIssue({
          severity: 'error',
          collection: 'malls',
          docId: mallId,
          field: 'coords',
          message: 'coords.lat and coords.lng must be numbers.',
          path: `malls/${mallId}`,
        });
      }
    }
  }

  if ((data.openTime && !data.closeTime) || (!data.openTime && data.closeTime)) {
    addIssue({
      severity: 'warning',
      collection: 'malls',
      docId: mallId,
      field: 'openTime/closeTime',
      message: 'openTime and closeTime should be provided together.',
      path: `malls/${mallId}`,
    });
  }

  if (data.hours != null) {
    const hours = data.hours;
    if (typeof hours !== 'object' || hours == null) {
      addIssue({
        severity: 'warning',
        collection: 'malls',
        docId: mallId,
        field: 'hours',
        message: 'hours should be an object with open/close.',
        path: `malls/${mallId}`,
      });
    } else if (!isNonEmptyString(hours.open) || !isNonEmptyString(hours.close)) {
      addIssue({
        severity: 'warning',
        collection: 'malls',
        docId: mallId,
        field: 'hours',
        message: 'hours.open and hours.close should be strings.',
        path: `malls/${mallId}`,
      });
    }
  }
}

function validateFloor(mallId, floorId, data) {
  if (!isNonEmptyString(data.label)) {
    addIssue({
      severity: 'error',
      collection: 'floors',
      docId: floorId,
      field: 'label',
      message: 'Floor label is required.',
      path: `malls/${mallId}/floors/${floorId}`,
    });
  }

  if (data.order == null || !Number.isFinite(data.order)) {
    addIssue({
      severity: 'warning',
      collection: 'floors',
      docId: floorId,
      field: 'order',
      message: 'Floor order should be a number.',
      path: `malls/${mallId}/floors/${floorId}`,
    });
  }

  if (data._mallId && data._mallId !== mallId) {
    addIssue({
      severity: 'warning',
      collection: 'floors',
      docId: floorId,
      field: '_mallId',
      message: `_mallId (${data._mallId}) does not match parent mallId (${mallId}).`,
      path: `malls/${mallId}/floors/${floorId}`,
    });
  }
}

function validateStore(mallId, storeId, data) {
  if (!isNonEmptyString(data.name)) {
    addIssue({
      severity: 'error',
      collection: 'stores',
      docId: storeId,
      field: 'name',
      message: 'Store name is required.',
      path: `malls/${mallId}/stores/${storeId}`,
    });
  }

  if (!isNonEmptyString(data.category)) {
    addIssue({
      severity: 'warning',
      collection: 'stores',
      docId: storeId,
      field: 'category',
      message: 'Store category should be a string.',
      path: `malls/${mallId}/stores/${storeId}`,
    });
  } else if (!STORE_CATEGORIES.has(data.category)) {
    addIssue({
      severity: 'warning',
      collection: 'stores',
      docId: storeId,
      field: 'category',
      message: `Category "${data.category}" is not in allowed list.`,
      path: `malls/${mallId}/stores/${storeId}`,
    });
  }

  if (!isNonEmptyString(data.floorId)) {
    addIssue({
      severity: 'warning',
      collection: 'stores',
      docId: storeId,
      field: 'floorId',
      message: 'floorId should be a string.',
      path: `malls/${mallId}/stores/${storeId}`,
    });
  }

  if (data.status != null && !STORE_STATUS.has(data.status)) {
    addIssue({
      severity: 'warning',
      collection: 'stores',
      docId: storeId,
      field: 'status',
      message: `Status "${data.status}" is not recognized.`,
      path: `malls/${mallId}/stores/${storeId}`,
    });
  }

  if (data._mallId && data._mallId !== mallId) {
    addIssue({
      severity: 'warning',
      collection: 'stores',
      docId: storeId,
      field: '_mallId',
      message: `_mallId (${data._mallId}) does not match parent mallId (${mallId}).`,
      path: `malls/${mallId}/stores/${storeId}`,
    });
  }

  if (data.mallCoords != null) {
    const coords = data.mallCoords;
    if (typeof coords !== 'object' || coords == null || !isNumber(coords.lat) || !isNumber(coords.lng)) {
      addIssue({
        severity: 'warning',
        collection: 'stores',
        docId: storeId,
        field: 'mallCoords',
        message: 'mallCoords should be { lat, lng } numbers.',
        path: `malls/${mallId}/stores/${storeId}`,
      });
    }
  }

  if (data.hours != null && !/^[0-2]?\d:\d{2}-[0-2]?\d:\d{2}$/.test(String(data.hours))) {
    addIssue({
      severity: 'warning',
      collection: 'stores',
      docId: storeId,
      field: 'hours',
      message: 'hours should be in HH:mm-HH:mm format.',
      path: `malls/${mallId}/stores/${storeId}`,
    });
  }
}

async function main() {
  const mallsSnap = await db.collection('malls').get();
  report.summary.malls = mallsSnap.size;

  for (const mallDoc of mallsSnap.docs) {
    const mallId = mallDoc.id;
    const mallData = mallDoc.data();
    validateMall(mallId, mallData);

    const floorsSnap = await db.collection('malls').doc(mallId).collection('floors').get();
    report.summary.floors += floorsSnap.size;
    floorsSnap.forEach((floorDoc) => {
      validateFloor(mallId, floorDoc.id, floorDoc.data());
    });

    const storesSnap = await db.collection('malls').doc(mallId).collection('stores').get();
    report.summary.stores += storesSnap.size;
    storesSnap.forEach((storeDoc) => {
      validateStore(mallId, storeDoc.id, storeDoc.data());
    });
  }

  const outPath = path.join(projectRoot, 'data', 'derived', 'firestore-validation.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('Firestore validation complete');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Report written to ${outPath}`);
}

main().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
