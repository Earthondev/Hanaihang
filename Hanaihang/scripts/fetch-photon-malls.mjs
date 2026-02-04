import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (typeof fetch !== 'function') {
  console.error('This script requires Node 18+ (global fetch).');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const AREAS_PATH = path.join(ROOT, 'data/osm/areas.json');
const BRANDS_PATH = path.join(ROOT, 'data/osm/brands.json');
const DERIVED_DIR = path.join(ROOT, 'data/derived');

const PHOTON_URL = 'https://photon.komoot.io/api/';
const USER_AGENT = process.env.OSM_USER_AGENT || 'HanaihangDataBot/1.0 (contact: data@localhost)';

const argMap = new Map();
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--') && arg.includes('=')) {
    const [key, value] = arg.slice(2).split('=');
    argMap.set(key, value);
  } else if (arg.startsWith('--')) {
    argMap.set(arg.slice(2), true);
  }
}

const areaFilter = argMap.get('areas')
  ? new Set(String(argMap.get('areas')).split(',').map((v) => v.trim()))
  : null;
const brandFilter = argMap.get('brands')
  ? new Set(String(argMap.get('brands')).split(',').map((v) => v.trim()))
  : null;

const outputFile = argMap.get('out')
  ? path.resolve(ROOT, String(argMap.get('out')))
  : path.join(DERIVED_DIR, 'malls-photon.json');

const limit = Number(argMap.get('limit') || 50);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildSearchKeywords = (displayName, slug, brandGroup) => {
  const keywords = new Set();
  if (displayName) {
    keywords.add(displayName);
    keywords.add(displayName.toLowerCase());
    keywords.add(displayName.replace(/\s+/g, ''));
  }
  if (slug) {
    keywords.add(slug);
    keywords.add(slug.replace(/-/g, ' '));
  }
  if (brandGroup) {
    keywords.add(brandGroup);
    keywords.add(brandGroup.toLowerCase());
  }
  return Array.from(keywords).filter(Boolean);
};

const buildAddress = (props) => {
  if (!props) return '';
  const parts = [
    props.housenumber,
    props.street,
    props.district,
    props.city,
    props.county,
    props.state,
    props.postcode,
    props.country,
  ].filter(Boolean);
  return parts.join(' ');
};

const fetchPhoton = async (params) => {
  const url = new URL(PHOTON_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Photon request failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
};

const shouldIncludeFeature = (feature, brand) => {
  const props = feature.properties || {};
  const text = [props.name, props.city, props.state, props.country, props.type].filter(Boolean).join(' ');

  const includeRegex = new RegExp(brand.include.map(escapeRegex).join('|'), 'i');
  if (!includeRegex.test(text)) return false;

  if (brand.exclude && brand.exclude.length > 0) {
    const excludeRegex = new RegExp(brand.exclude.map(escapeRegex).join('|'), 'i');
    if (excludeRegex.test(text)) return false;
  }

  const key = props.osm_key;
  const value = props.osm_value;
  if (brand.shopAllow || brand.amenityAllow) {
    const shopOk = key === 'shop' && brand.shopAllow?.includes(value);
    const amenityOk = key === 'amenity' && brand.amenityAllow?.includes(value);
    return Boolean(shopOk || amenityOk);
  }

  return true;
};

const featureToMall = (feature, brand, area) => {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  const lng = coords[0];
  const lat = coords[1];
  if (!lat || !lng) return null;

  const displayName = props.name || props.osm_value || brand.label;
  const slugBase = toSlug(displayName);
  const slug = props.osm_id ? `${slugBase}-${props.osm_id}` : slugBase;

  return {
    name: slug,
    displayName,
    nameLower: displayName.toLowerCase(),
    searchKeywords: buildSearchKeywords(displayName, slug, brand.label),
    address: buildAddress(props),
    district: props.district || props.city || props.county || props.state || '',
    province: area.province,
    contact: {
      phone: props.phone || '',
      website: props.website || '',
      social: props.facebook || props.instagram || '',
    },
    lat,
    lng,
    coords: { lat, lng },
    openTime: '',
    closeTime: '',
    category: brand.category,
    categoryLabel: brand.categoryLabel,
    status: 'Active',
    storeCount: 0,
    floorCount: 0,
    brandGroup: brand.label,
    sources: [
      {
        name: 'Photon (OpenStreetMap)',
        url: `https://www.openstreetmap.org/${props.osm_type}/${props.osm_id}`,
        retrievedAt: new Date().toISOString(),
        license: 'ODbL 1.0',
      },
    ],
    osm: {
      id: props.osm_id,
      type: props.osm_type,
    },
  };
};

const main = async () => {
  const areasData = JSON.parse(await fs.readFile(AREAS_PATH, 'utf8'));
  const brandsData = JSON.parse(await fs.readFile(BRANDS_PATH, 'utf8'));

  const areas = (areasData.areas || []).filter((area) =>
    areaFilter ? areaFilter.has(area.id) : true,
  );
  const brands = (brandsData.brands || []).filter((brand) =>
    brandFilter ? brandFilter.has(brand.id) : true,
  );

  if (!areas.length) throw new Error('No areas selected');
  if (!brands.length) throw new Error('No brands selected');

  const malls = [];
  const seen = new Set();

  for (const area of areas) {
    if (!area.bbox) {
      throw new Error(`Missing bbox for area ${area.id}`);
    }

    for (const brand of brands) {
      for (const term of brand.include) {
        const response = await fetchPhoton({
          q: term,
          bbox: area.bbox,
          limit,
        });

        const features = response.features || [];
        for (const feature of features) {
          if (!shouldIncludeFeature(feature, brand)) continue;
          const mall = featureToMall(feature, brand, area);
          if (!mall) continue;
          const key = `${mall.osm?.type}:${mall.osm?.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          malls.push(mall);
        }

        await sleep(500);
      }
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    sources: ['Photon (OpenStreetMap)'],
    malls,
  };

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`✅ Wrote ${malls.length} malls to ${outputFile}`);
};

main().catch((error) => {
  console.error('❌ Failed to fetch Photon malls:', error);
  process.exit(1);
});
