import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DIRECTORY_URL = 'https://www.siamparagon.co.th/directory';

function decodeEscaped(input) {
  return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
}

async function fetchHtml() {
  const res = await fetch(DIRECTORY_URL, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; HanaihangBot/1.0)',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch directory: ${res.status}`);
  }
  return res.text();
}

function extractPayload(html) {
  const regex = /self.__next_f.push\(\[(\d+),"(.*?)"\]\)/gs;
  const chunks = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    chunks.push(decodeEscaped(match[2]));
  }
  return chunks.join('');
}

function extractOccupants(payload) {
  const key = 'occupantsByCategory';
  const idx = payload.indexOf(key);
  if (idx === -1) {
    throw new Error('occupantsByCategory not found in payload');
  }

  // find the first '{' after the key
  let start = payload.indexOf('{', idx);
  if (start === -1) {
    throw new Error('Expected object for occupantsByCategory');
  }

  let level = 0;
  let end = start;
  for (let i = start; i < payload.length; i += 1) {
    const ch = payload[i];
    if (ch === '{') level += 1;
    if (ch === '}') {
      level -= 1;
      if (level === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const jsonStr = payload.slice(start, end);
  const data = JSON.parse(jsonStr);
  return data;
}

function normalizeLevel(level) {
  if (!level) return '';
  const cleaned = String(level).trim().toUpperCase();
  if (cleaned === 'GF') return 'G';
  return cleaned;
}

async function main() {
  const html = await fetchHtml();
  const payload = extractPayload(html);
  const occupants = extractOccupants(payload);

  const list = [];
  const categories = ['shop', 'dine', 'seeAndDo'];
  for (const category of categories) {
    const entries = occupants[category] || [];
    for (const entry of entries) {
      const props = entry.properties || {};
      const name = props.name?.en?.trim() || '';
      const floor = normalizeLevel(props.level_name);
      const keywords = props.keywords || [];
      list.push({
        name,
        floor,
        category,
        keywords,
      });
    }
  }

  const output = {
    source: DIRECTORY_URL,
    retrievedAt: new Date().toISOString(),
    count: list.length,
    stores: list.filter((s) => s.name),
  };

  const outDir = path.join(process.cwd(), 'data', 'derived');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'siamparagon-directory.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`Extracted ${output.count} entries`);
  console.log(`Output: ${outPath}`);
}

main().catch((error) => {
  console.error('Scrape failed:', error);
  process.exit(1);
});
