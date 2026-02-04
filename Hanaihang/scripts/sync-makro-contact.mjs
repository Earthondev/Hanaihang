import https from 'node:https';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

const CONTACT_URL = 'https://www.makro.co.th/en/contact-us/2/Chaengwattana';
const MALL_SLUG = 'makro-chaengwattana';

const fetchText = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (HanaihangDataBot/1.0)' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
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

const stripTags = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractAddress = (text) => {
  const match = text.match(/Chaengwattana\s+([\s\S]*?)\s+0\d{1,3}-\d{3}-\d{4}/i);
  if (match) return match[1].trim();
  const alt = text.match(/Chaengwattana\s+([\s\S]*?)\s+Graphic Map/i);
  if (alt) return alt[1].trim();
  return '';
};

const extractPhones = (text) => {
  const phones = text.match(/\b0\d{1,2}-\d{3}-\d{4}\b/g) || [];
  return Array.from(new Set(phones));
};

const extractDistrict = (address) => {
  const match = address.match(/(Pakkred|Pak Kret|Pakkret)/i);
  if (match) return 'Pak Kret';
  return '';
};

const main = async () => {
  const html = await fetchText(CONTACT_URL);
  const text = stripTags(html);

  const address = extractAddress(text);
  const phones = extractPhones(text);

  await initFirebase();
  const db = admin.firestore();
  const mallRef = db.collection('malls').doc(MALL_SLUG);
  const mallSnap = await mallRef.get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const payload = {
    name: MALL_SLUG,
    displayName: 'Makro แจ้งวัฒนะ',
    nameLower: 'makro แจ้งวัฒนะ'.toLowerCase(),
    searchKeywords: ['makro', 'แม็คโคร', 'แจ้งวัฒนะ', 'chaengwattana'],
    address,
    district: extractDistrict(address),
    province: address.includes('Nonthaburi') ? 'Nonthaburi' : '',
    contact: {
      phone: phones.join(', '),
      website: CONTACT_URL,
      social: '',
    },
    category: 'department-store',
    categoryLabel: 'ห้างสรรพสินค้า',
    brandGroup: 'Makro',
    status: 'Active',
    sources: [
      {
        name: 'Makro Contact Us (official)',
        url: CONTACT_URL,
        retrievedAt: new Date().toISOString().slice(0, 10),
        note: 'Address and phone from official contact page.',
      },
    ],
    updatedAt: now,
  };

  if (!mallSnap.exists) {
    payload.createdAt = now;
  }

  await mallRef.set(payload, { merge: true });
  console.log('✅ Updated mall:', MALL_SLUG);
  console.log({ address, phones });
};

main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
