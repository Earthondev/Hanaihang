# Data Pipeline (OSM -> Firestore)

This project supports importing malls and store directories into Firestore using open data sources.

## 1) Requirements

- Node 18+ (global `fetch` required for the OSM pipeline)
- Firebase service account JSON
- `.env` file with:

```env
FIREBASE_PROJECT_ID=hanaihang-fe9ec
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

## 2) Fetch malls from OpenStreetMap (Photon or Overpass)

This step pulls POIs from OSM and writes a normalized JSON file.

```bash
npm run fetch:photon
```

Optional filters:

```bash
npm run fetch:photon -- --areas=bangkok,nonthaburi
npm run fetch:photon -- --brands=bigc,lotus
npm run fetch:photon -- --out data/derived/malls-photon.json
```

Inputs:
- `data/osm/areas.json`
- `data/osm/brands.json`

Outputs:
- `data/derived/malls-photon.json`

Overpass option (slower, may be rate-limited):

```bash
npm run fetch:osm
```

## 3) Import malls into Firestore

```bash
node scripts/import-malls-from-json.mjs --file data/derived/malls-photon.json
```

Dry run:

```bash
node scripts/import-malls-from-json.mjs --file data/derived/malls-photon.json --dry-run
```

## 4) Import store directories (optional)

Prepare a directory file in `data/directories/<mallSlug>.json`:

```json
{
  "mallSlug": "central-world",
  "source": {
    "name": "CentralWorld Directory",
    "url": "https://example.com",
    "retrievedAt": "2026-02-03"
  },
  "floors": [
    {
      "label": "G",
      "order": 0,
      "stores": [
        {
          "name": "Example Store",
          "category": "Fashion",
          "unit": "G-15",
          "phone": "02-000-0000",
          "hours": "10:00-22:00"
        }
      ]
    }
  ]
}
```

Import:

```bash
node scripts/import-store-directory.mjs --file data/directories/central-world.json
```

## Notes

- OSM data is licensed under ODbL. Keep attribution in `sources`.
- For better accuracy, you can add manual entries to the JSON before import.
