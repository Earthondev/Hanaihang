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

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { mallIds: [], top: 5 };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--mallId' && args[i + 1]) {
      options.mallIds = args[i + 1].split(',').map((v) => v.trim()).filter(Boolean);
      i += 1;
      continue;
    }
    if (arg.startsWith('--mallId=')) {
      options.mallIds = arg.split('=')[1].split(',').map((v) => v.trim()).filter(Boolean);
      continue;
    }
    if (arg === '--top' && args[i + 1]) {
      options.top = Number(args[i + 1]) || options.top;
      i += 1;
      continue;
    }
    if (arg.startsWith('--top=')) {
      options.top = Number(arg.split('=')[1]) || options.top;
      continue;
    }
  }

  return options;
}

function toTsvRow(values) {
  return values
    .map((value) => {
      if (value == null) return '';
      const str = String(value);
      return str.replace(/\r?\n/g, ' ').replace(/\t/g, ' ');
    })
    .join('\t');
}

async function getMallStoreCounts() {
  const mallsSnap = await db.collection('malls').get();
  const result = [];

  for (const mallDoc of mallsSnap.docs) {
    const storesSnap = await mallDoc.ref.collection('stores').get();
    result.push({
      id: mallDoc.id,
      data: mallDoc.data(),
      storeCount: storesSnap.size,
    });
  }

  result.sort((a, b) => b.storeCount - a.storeCount);
  return result;
}

async function main() {
  const options = parseArgs();
  const mallsWithCounts = await getMallStoreCounts();

  const selectedMalls = options.mallIds.length
    ? mallsWithCounts.filter((m) => options.mallIds.includes(m.id))
    : mallsWithCounts.slice(0, options.top);

  if (selectedMalls.length === 0) {
    console.log('No malls selected. Use --mallId or --top.');
    return;
  }

  const header = [
    'mallId',
    'mallName',
    'storeId',
    'storeName',
    'category',
    'floorId',
    'floorLabel',
    'unit',
    'landmarks',
    'directions',
    'nearbyStores',
    'notes',
  ];

  const rows = [toTsvRow(header)];

  for (const mall of selectedMalls) {
    const mallName = mall.data.displayName || mall.data.name || mall.id;
    const storesSnap = await db.collection('malls').doc(mall.id).collection('stores').get();
    for (const storeDoc of storesSnap.docs) {
      const store = storeDoc.data();
      rows.push(
        toTsvRow([
          mall.id,
          mallName,
          storeDoc.id,
          store.name || '',
          store.category || '',
          store.floorId || '',
          store.floorLabel || '',
          store.unit || '',
          Array.isArray(store.landmarks) ? store.landmarks.join('; ') : '',
          store.directions || '',
          Array.isArray(store.nearbyStores) ? store.nearbyStores.join('; ') : '',
          '',
        ])
      );
    }
  }

  const outDir = path.join(projectRoot, 'data', 'curation');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = path.join(outDir, `store-landmarks-${stamp}.tsv`);
  fs.writeFileSync(outPath, rows.join('\n'));

  console.log('Export complete.');
  console.log(`Malls included: ${selectedMalls.map((m) => m.id).join(', ')}`);
  console.log(`Output: ${outPath}`);
}

main().catch((error) => {
  console.error('Export failed:', error);
  process.exit(1);
});
