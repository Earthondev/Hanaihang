import json
import os
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.request import Request, urlopen

DIRECTORY_URL = "https://www.charnattheavenue.com/directory"
USER_AGENT = "Mozilla/5.0 (HanaihangDataBot/1.0)"

STATUS_TOKENS = {"Now Open", "Opening Soon", "Coming Soon"}


class TextCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tokens = []

    def handle_data(self, data):
        text = data.strip()
        if text:
            self.tokens.append(text)


def fetch_html():
    req = Request(DIRECTORY_URL, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "ignore")


def normalize_floor(floor_text):
    if not floor_text:
        return None
    match = re.search(r"Floor\\s+(\\d+)", floor_text, re.IGNORECASE)
    if match:
        return match.group(1)
    return floor_text.replace("Floor", "").strip()


def normalize_unit(unit_text):
    if not unit_text:
        return None
    return unit_text.replace("Unit no.", "").strip()


def is_thai(text):
    return bool(re.search(r"[\\u0E00-\\u0E7F]", text))


def parse_directory(tokens):
    entries = []
    in_directory = False
    current = {}

    for token in tokens:
        if token.upper() == "DIRECTORY":
            in_directory = True
            continue
        if not in_directory:
            continue
        if token == "Site Index":
            break

        if token in STATUS_TOKENS:
            if current.get("name_en"):
                current["status"] = token
                entries.append(current)
            current = {}
            continue

        if token.startswith("Building"):
            current["building"] = token
            continue
        if token.startswith("Floor"):
            current["floor"] = token
            continue
        if token.startswith("Unit no."):
            current["unit"] = token
            continue

        if not current.get("name_en"):
            current["name_en"] = token
            continue

        if not current.get("name_th") and is_thai(token):
            current["name_th"] = token
            continue

        if current.get("name_en") and not current.get("name_th") and not is_thai(token):
            current["name_en"] = f"{current['name_en']} {token}"
            continue

    return entries


def main():
    html = fetch_html()
    parser = TextCollector()
    parser.feed(html)
    entries = parse_directory(parser.tokens)

    floors = {}
    for entry in entries:
        floor_label = normalize_floor(entry.get("floor"))
        floor_id = floor_label or "Unknown"
        unit = normalize_unit(entry.get("unit"))
        building = entry.get("building")
        store = {
            "name": entry.get("name_en", "").strip(),
            "category": "Services",
            "floorId": floor_id,
            "floorLabel": floor_label or floor_id,
            "unit": unit or "",
            "status": "Active" if entry.get("status") == "Now Open" else "Closed",
            "landmarks": [building] if building else [],
        }

        if entry.get("name_th"):
            store["nameLocal"] = entry["name_th"].strip()

        floors.setdefault(floor_id, []).append(store)

    floor_entries = []
    for floor_id, stores in floors.items():
        order = int(floor_id) if str(floor_id).isdigit() else 0
        floor_entries.append({
            "id": floor_id,
            "label": floor_id,
            "name": f"Floor {floor_id}" if str(floor_id).isdigit() else floor_id,
            "order": order,
            "stores": stores,
        })

    floor_entries.sort(key=lambda item: item.get("order", 0))

    retrieved_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    output = {
        "mallSlug": "charn-at-the-avenue",
        "source": {
            "name": "Charn at the Avenue Directory (official)",
            "url": DIRECTORY_URL,
            "retrievedAt": retrieved_at,
        },
        "retrievedAt": retrieved_at,
        "floorCount": len(floor_entries),
        "storeCount": sum(len(f["stores"]) for f in floor_entries),
        "floors": floor_entries,
    }

    out_dir = os.path.join(os.getcwd(), "data", "directories")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "charn-at-the-avenue.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Extracted {output['storeCount']} stores for Charn at the Avenue")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
