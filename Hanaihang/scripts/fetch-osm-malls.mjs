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
const RAW_DIR = path.join(ROOT, 'data/raw/osm');
const DERIVED_DIR = path.join(ROOT, 'data/derived');
const AREA_CACHE_PATH = path.join(RAW_DIR, 'area-cache.json');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
];
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
  : path.join(DERIVED_DIR, 'malls-osm.json');

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

const buildAddress = (tags) => {
  if (!tags) return '';
  if (tags['addr:full']) return tags['addr:full'];
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:subdistrict'],
    tags['addr:district'],
    tags['addr:city'],
    tags['addr:province'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return parts.join(' ');
};

const parseOpeningHours = (value) => {
  if (!value) return { openTime: '', closeTime: '' };
  const match = String(value).match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return { openTime: '', closeTime: '' };
  return { openTime: match[1], closeTime: match[2] };
};

const loadJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

const saveJson = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const toAreaId = (osmType, osmId) => {
  if (osmType === 'relation') return 3600000000 + Number(osmId);
  if (osmType === 'way') return 2400000000 + Number(osmId);
  if (osmType === 'node') return 3600000000 + Number(osmId);
  throw new Error(`Unsupported osm_type: ${osmType}`);
};

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
};

const fetchOverpass = async (query) => {
  const body = new URLSearchParams({ data: query }).toString();
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetchJson(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        return response;
      } catch (error) {
        lastError = error;
        const delay = 1500 * attempt;
        console.warn(`⚠️ Overpass error (${endpoint}, attempt ${attempt}): ${error.message || error}`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

const resolveAreaId = async (searchName, cache) => {
  if (cache[searchName]) return cache[searchName];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', searchName);
  url.searchParams.set('accept-language', 'en');

  const data = await fetchJson(url.toString());
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Nominatim: area not found for ${searchName}`);
  }

  const result = data[0];
  const areaId = toAreaId(result.osm_type, result.osm_id);
  const payload = {
    searchName,
    osmType: result.osm_type,
    osmId: result.osm_id,
    areaId,
    displayName: result.display_name,
    fetchedAt: new Date().toISOString(),
  };
  cache[searchName] = payload;
  await saveJson(AREA_CACHE_PATH, cache);
  return payload;
};

const buildOverpassQuery = (areaId, brand) => {
  const includeRegex = brand.include.map(escapeRegex).join('|');
  const shopRegex = brand.shopAllow?.length ? brand.shopAllow.map(escapeRegex).join('|') : null;
  const amenityRegex = brand.amenityAllow?.length ? brand.amenityAllow.map(escapeRegex).join('|') : null;

  const fields = [
    'name',
    'brand',
    'operator',
    'name:en',
    'brand:en',
    'operator:en',
  ];

  const lines = [];

  for (const field of fields) {
    if (shopRegex) {
      lines.push(`  nwr["${field}"~"${includeRegex}",i]["shop"~"^(${shopRegex})$"](area.searchArea);`);
    }
    if (amenityRegex) {
      lines.push(`  nwr["${field}"~"${includeRegex}",i]["amenity"~"^(${amenityRegex})$"](area.searchArea);`);
    }
    if (!shopRegex && !amenityRegex) {
      lines.push(`  nwr["${field}"~"${includeRegex}",i](area.searchArea);`);
    }
  }

  return `
[out:json][timeout:120];
area(${areaId})->.searchArea;
(
${lines.join('\n')}
);
out center tags;
`;
};

const shouldIncludeElement = (element, brand) => {
  const tags = element.tags || {};
  const text = [
    tags.name,
    tags.brand,
    tags.operator,
    tags['name:en'],
    tags['brand:en'],
    tags['operator:en'],
  ]
    .filter(Boolean)
    .join(' ');

  const includeRegex = new RegExp(brand.include.map(escapeRegex).join('|'), 'i');
  if (!includeRegex.test(text)) return false;

  if (brand.exclude && brand.exclude.length > 0) {
    const excludeRegex = new RegExp(brand.exclude.map(escapeRegex).join('|'), 'i');
    if (excludeRegex.test(text)) return false;
  }

  if (brand.shopAllow && tags.shop && !brand.shopAllow.includes(tags.shop)) return false;
  if (brand.amenityAllow && tags.amenity && !brand.amenityAllow.includes(tags.amenity)) return false;

  return true;
};

const elementToMall = (element, brand, areaMeta) => {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!lat || !lng) return null;

  const displayName = tags.name || tags['name:en'] || tags.brand || tags.operator || brand.label;
  const slug = toSlug(displayName);
  const opening = parseOpeningHours(tags.opening_hours);

  return {
    name: slug,
    displayName,
    nameLower: displayName.toLowerCase(),
    searchKeywords: buildSearchKeywords(displayName, slug, brand.label),
    address: buildAddress(tags),
    district: tags['addr:district'] || tags['addr:subdistrict'] || tags['addr:city'] || tags['addr:province'] || '',
    province: areaMeta.province,
    contact: {
      phone: tags.phone || tags['contact:phone'] || '',
      website: tags.website || tags['contact:website'] || '',
      social: tags['contact:facebook'] || tags['contact:instagram'] || '',
    },
    lat,
    lng,
    coords: { lat, lng },
    openTime: opening.openTime || '',
    closeTime: opening.closeTime || '',
    category: brand.category,
    categoryLabel: brand.categoryLabel,
    status: 'Active',
    storeCount: 0,
    floorCount: 0,
    brandGroup: brand.label,
    sources: [
      {
        name: 'OpenStreetMap (Overpass API)',
        url: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        retrievedAt: new Date().toISOString(),
        license: 'ODbL 1.0',
      },
    ],
    osm: {
      id: element.id,
      type: element.type,
    },
  };
};

const main = async () => {
  const areasData = await loadJson(AREAS_PATH);
  const brandsData = await loadJson(BRANDS_PATH);

  const areas = (areasData.areas || []).filter((area) =>
    areaFilter ? areaFilter.has(area.id) : true,
  );
  const brands = (brandsData.brands || []).filter((brand) =>
    brandFilter ? brandFilter.has(brand.id) : true,
  );

  if (!areas.length) throw new Error('No areas selected');
  if (!brands.length) throw new Error('No brands selected');

  const cache = await (async () => {
    try {
      return await loadJson(AREA_CACHE_PATH);
    } catch {
      return {};
    }
  })();

  const rawMeta = {
    generatedAt: new Date().toISOString(),
    areas,
    brands,
    results: [],
  };

  const malls = [];
  const seen = new Set();

  for (const area of areas) {
    const areaMeta = await resolveAreaId(area.searchName, cache);
    await sleep(1100);

    for (const brand of brands) {
      const query = buildOverpassQuery(areaMeta.areaId, brand);
      const response = await fetchOverpass(query);

      rawMeta.results.push({
        areaId: areaMeta.areaId,
        area: area,
        brand: brand.id,
        fetchedAt: new Date().toISOString(),
        count: response.elements?.length || 0,
      });

      const elements = response.elements || [];
      for (const element of elements) {
        if (!shouldIncludeElement(element, brand)) continue;
        const mall = elementToMall(element, brand, area);
        if (!mall) continue;
        const key = `${brand.id}:${element.type}:${element.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        malls.push(mall);
      }

      await sleep(1500);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    sources: ['OpenStreetMap (Overpass API)', 'Nominatim'],
    malls,
  };

  const rawFile = path.join(RAW_DIR, `osm-raw-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await saveJson(rawFile, rawMeta);
  await saveJson(outputFile, output);

  console.log(`✅ Wrote ${malls.length} malls to ${outputFile}`);
  console.log(`🧪 Raw metadata saved to ${rawFile}`);
};

main().catch((error) => {
  console.error('❌ Failed to fetch OSM malls:', error);
  process.exit(1);
});
