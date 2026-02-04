import json
import os
from datetime import datetime, timezone

def convert_paragon():
    src_path = 'data/derived/siamparagon-directory.json'
    if not os.path.exists(src_path):
        print(f"Source {src_path} not found")
        return

    with open(src_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    stores_by_floor = {}
    for store in data.get('stores', []):
        floor = store.get('floor') or 'UNKNOWN'
        if floor not in stores_by_floor:
            stores_by_floor[floor] = []
        
        stores_by_floor[floor].append({
            "name": store['name'],
            "category": store.get('category', 'Services'),
            "categoryLabel": store.get('category'),
            "floorId": floor,
            "floorLabel": f"{floor} Floor" if floor != 'UNKNOWN' else 'UNKNOWN',
            "unit": "",
            "hours": None,
            "status": "Active",
            "keywords": store.get('keywords', [])
        })

    floor_entries = []
    # Sort order (rough estimation)
    order_map = {'B': -1, 'G': 0, 'M': 1, '1': 2, '2': 3, '3': 4, '4': 5, '5': 6, '6': 7}
    
    for floor_id, stores in stores_by_floor.items():
        order = 0
        first_char = floor_id[0].upper() if floor_id else ''
        if first_char in order_map:
            order = order_map[first_char]
        
        floor_entries.append({
            "id": floor_id,
            "label": floor_id,
            "name": f"{floor_id} Floor" if floor_id != 'UNKNOWN' else 'UNKNOWN',
            "order": order,
            "stores": stores
        })

    floor_entries.sort(key=lambda x: x['order'])

    output = {
        "mallSlug": "siam-paragon",
        "source": {
            "name": "Siam Paragon Directory (derived)",
            "url": data.get('source'),
            "retrievedAt": data.get('retrievedAt')
        },
        "retrievedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "floorCount": len(floor_entries),
        "storeCount": data.get('count', 0),
        "floors": floor_entries
    }

    out_path = 'data/directories/siam-paragon.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Converted {data.get('count')} stores to {out_path}")

if __name__ == "__main__":
    convert_paragon()
