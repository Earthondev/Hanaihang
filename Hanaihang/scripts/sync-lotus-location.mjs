import https from 'node:https';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const LOCATION_URL = 'https://corporate.lotuss.com/en/location/json-data/';
const TARGET_NAME_TH = 'โลตัส แจ้งวัฒนะ';
const TARGET_TYPE = 'stores-lotuss-extra';
const MALL_SLUG = 'lotus-chaengwattana';

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (HanaihangDataBot/1.0)' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });

const initFirebase = async () => {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required in env');
  if (!credentialsPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required in env');

  const serviceAccount = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });
};

const parseHours = (raw) => {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;
  if (text.includes('24')) {
    return { open: '00:00', close: '23:59' };
  }
  const match = text.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { open: match[1], close: match[2] };
};

const extractDistrict = (address) => {
  const match = address.match(/เขต([^\s]+)/);
  if (match) return match[1].trim();
  const alt = address.match(/อ\.([^\s]+)/);
  if (alt) return alt[1].trim();
  return '';
};

const extractProvince = (address) => {
  if (address.includes('กรุงเทพ')) return 'กรุงเทพมหานคร';
  const match = address.match(/จ\.([^\s]+)/);
  if (match) return match[1].trim();
  return '';
};

const main = async () => {
  const data = await fetchJson(LOCATION_URL);
  const items = data?.data || [];

  const match = items.find(
    (item) =>
      String(item?.name || '').includes(TARGET_NAME_TH) &&
      (!TARGET_TYPE || item?.type === TARGET_TYPE),
  );

  if (!match) {
    throw new Error(`Location not found for ${TARGET_NAME_TH}`);
  }

  const hours = parseHours(match.opening_hours);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await initFirebase();
  const db = admin.firestore();
  const mallRef = db.collection('malls').doc(MALL_SLUG);
  const snap = await mallRef.get();

  const payload = {
    name: MALL_SLUG,
    displayName: "Lotus's แจ้งวัฒนะ",
    nameLower: "lotus's แจ้งวัฒนะ".toLowerCase(),
    searchKeywords: ['lotus', "lotus's", 'โลตัส', 'แจ้งวัฒนะ', 'chaengwattana'],
    address: match.address || '',
    district: extractDistrict(match.address || ''),
    province: extractProvince(match.address || ''),
    contact: {
      phone: match.phone_number || '',
      website: 'https://corporate.lotuss.com/en/location/',
      social: match.line_url || '',
    },
    lat: Number(match.latitude) || undefined,
    lng: Number(match.longitude) || undefined,
    coords:
      Number(match.latitude) && Number(match.longitude)
        ? { lat: Number(match.latitude), lng: Number(match.longitude) }
        : undefined,
    openTime: hours?.open || '',
    closeTime: hours?.close || '',
    hours: hours ? { open: hours.open, close: hours.close } : undefined,
    category: 'department-store',
    categoryLabel: 'ห้างสรรพสินค้า',
    brandGroup: "Lotus's",
    status: 'Active',
    sources: [
      {
        name: "Lotus's Corporate Location Data",
        url: LOCATION_URL,
        retrievedAt: new Date().toISOString().slice(0, 10),
        note: 'Address, phone, hours, coordinates from official location list.',
      },
    ],
    updatedAt: now,
  };

  if (!snap.exists) {
    payload.createdAt = now;
  }

  await mallRef.set(payload, { merge: true });

  console.log('✅ Updated mall:', MALL_SLUG);
  console.log(JSON.stringify({
    name: match.name,
    address: match.address,
    opening_hours: match.opening_hours,
    phone: match.phone_number,
    lat: match.latitude,
    lng: match.longitude,
  }, null, 2));
};

main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
