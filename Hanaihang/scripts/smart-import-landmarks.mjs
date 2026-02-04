import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

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
        projectId: serviceAccount.project_id
    });
}

const db = admin.firestore();

function parseArgs() {
    const args = process.argv.slice(2);
    let file = null;
    let dryRun = false;
    let upsert = false;

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if ((arg === '--file' || arg === '-f') && args[i + 1]) {
            file = args[i + 1];
            i += 1;
            continue;
        }
        if (arg.startsWith('--file=')) {
            file = arg.split('=')[1];
            continue;
        }
        if (arg === '--dry-run') dryRun = true;
        if (arg === '--upsert') upsert = true;
    }

    if (!file) throw new Error('Missing --file argument');
    return { file, dryRun, upsert };
}

function parseTsv(content) {
    const lines = content.split(/\r?\n/).filter(Boolean);
    const [headerLine, ...rows] = lines;
    const headers = headerLine.split('\t').map((h) => h.trim());
    return rows.map((line) => {
        const cols = line.split('\t');
        const record = {};
        headers.forEach((key, idx) => {
            record[key] = cols[idx] != null ? cols[idx].trim() : '';
        });
        return record;
    });
}

const normalizeStoreName = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/\s*#\d+$/, '')
        .replace(/[^\u0E00-\u0E7Fa-z0-9]/g, '')
        .trim();

function normalizeFloor(f) {
    if (!f) return '';
    let s = String(f).toUpperCase().trim();
    s = s.replace(/(FL|FLOOR)$/, '').trim();
    if (!['MF', 'GF', 'UG', 'LG'].includes(s)) {
        s = s.replace(/F$/, '');
    }
    if (s === 'G' || s === 'GF' || s === 'GROUND') return 'G';
    if (['M', 'MF', 'MAIN', 'MAIN FLOOR'].includes(s)) return 'M';
    if (s === 'UG' || s === 'UPPER GROUND') return 'UG';
    if (s === 'LG' || s === 'LOWER GROUND') return 'LG';
    const digitMatch = s.match(/^(\d+)$/);
    if (digitMatch) return digitMatch[1];
    return s;
}

const normalizeCategory = (raw) => {
    if (!raw) return 'Services';
    const text = raw.toLowerCase();
    if (text.includes('food') || text.includes('cafe') || text.includes('restaurant') || text.includes('dining')) return 'Food & Beverage';
    if (text.includes('fashion') || text.includes('apparel') || text.includes('clothing')) return 'Fashion';
    if (text.includes('beauty') || text.includes('cosmetic')) return 'Beauty';
    if (text.includes('electronics') || text.includes('tech')) return 'Electronics';
    if (text.includes('sport') || text.includes('fitness')) return 'Sports';
    if (text.includes('book') || text.includes('stationery')) return 'Books';
    if (text.includes('home') || text.includes('furniture')) return 'Home & Garden';
    if (text.includes('health') || text.includes('pharmacy')) return 'Health & Pharmacy';
    if (text.includes('entertainment') || text.includes('cinema')) return 'Entertainment';
    return 'Services';
};

async function main() {
    const { file, dryRun, upsert } = parseArgs();
    const content = fs.readFileSync(file, 'utf8');
    const rows = parseTsv(content);

    const mallGroups = {};
    for (const row of rows) {
        if (!row.mallId) continue;
        if (!mallGroups[row.mallId]) mallGroups[row.mallId] = [];
        mallGroups[row.mallId].push(row);
    }

    const ops = [];
    let stats = { matched: 0, created: 0, skipped: 0 };

    for (const [mallId, records] of Object.entries(mallGroups)) {
        console.log(`\n📦 Mall: ${mallId}`);
        const mallRef = db.collection('malls').doc(mallId);
        const mallSnap = await mallRef.get();
        if (!mallSnap.exists) {
            console.warn(`  ⚠️ Mall ${mallId} not found. Skipping.`);
            continue;
        }
        const mallData = mallSnap.data();

        const storesSnap = await mallRef.collection('stores').get();
        const firestoreStores = storesSnap.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));

        for (const record of records) {
            const targetName = normalizeStoreName(record.storeName);
            const targetFloor = normalizeFloor(record.floorId);

            let match = firestoreStores.find(s =>
                normalizeStoreName(s.name) === targetName && normalizeFloor(s.floorId) === targetFloor
            );

            if (!match) {
                match = firestoreStores.find(s =>
                    (normalizeStoreName(s.name).startsWith(targetName) || targetName.startsWith(normalizeStoreName(s.name))) &&
                    normalizeFloor(s.floorId) === targetFloor
                );
            }

            if (match) {
                const update = {};
                if (record.landmarks) update.landmarks = admin.firestore.FieldValue.arrayUnion(...record.landmarks.split(';').map(s => s.trim()).filter(Boolean));
                if (record.directions) update.directions = record.directions;
                if (record.unit && !match.unit) update.unit = record.unit;

                if (Object.keys(update).length > 0) {
                    ops.push({ type: 'update', ref: match.ref, data: update, log: `Update ${match.name}` });
                    stats.matched++;
                }
            } else if (upsert) {
                // Create new store
                const storeId = record.storeId || `${mallId}-${normalizeStoreName(record.storeName)}-${targetFloor}`;
                const newRef = mallRef.collection('stores').doc(storeId);
                const newData = {
                    name: record.storeName.replace(/\s*#\d+$/, ''),
                    category: normalizeCategory(record.category),
                    floorId: record.floorId,
                    floorLabel: record.floorLabel,
                    unit: record.unit,
                    mallId,
                    mallSlug: mallId,
                    mallName: mallData.displayName || mallId,
                    status: 'Active',
                    landmarks: record.landmarks ? record.landmarks.split(';').map(s => s.trim()).filter(Boolean) : [],
                    directions: record.directions || '',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                ops.push({ type: 'set', ref: newRef, data: newData, log: `Create ${newData.name}` });
                stats.created++;
            } else {
                stats.skipped++;
            }
        }
    }

    console.log(`\nReady to perform ${ops.length} operations.`);
    console.log(`Stats: Matched: ${stats.matched}, Created: ${stats.created}, Skipped: ${stats.skipped}`);

    if (dryRun) {
        console.log('--- DRY RUN ---\nSample ops:');
        console.log(ops.slice(0, 5).map(o => `${o.type}: ${o.ref.path} (${o.log})`));
        return;
    }

    if (ops.length === 0) return;

    const BATCH_SIZE = 400;
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = ops.slice(i, i + BATCH_SIZE);
        for (const op of chunk) {
            if (op.type === 'update') batch.update(op.ref, op.data);
            else if (op.type === 'set') batch.set(op.ref, op.data, { merge: true });
        }
        await batch.commit();
        console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(ops.length / BATCH_SIZE)}`);
    }
    console.log('✅ Success!');
}

main().catch(console.error);
