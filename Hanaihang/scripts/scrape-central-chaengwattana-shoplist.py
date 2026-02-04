import json
import os
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.request import Request, urlopen

DIRECTORY_URL = "https://dg-directory-physical.cpn.co.th/directory/line/CWN/en/shoplist/"
USER_AGENT = "Mozilla/5.0 (HanaihangDataBot/1.0)"

FLOOR_TOKEN_RE = re.compile(r"^(B\\d+|GF|G|UG|LG|MF|M|\\d{1,2}F)$", re.IGNORECASE)

SKIP_TOKENS = {
    "Shop search",
    "BANGKOK",
    "NORTHERN",
    "SOUTHERN",
    "EASTERN",
    "NORTHEASTERN",
    "ALL SHOPS",
    "A-Z",
    "Category",
}

CATEGORY_HEADERS = {
    "Speciality",
    "Fashion",
    "Services",
    "Beauty",
    "Lifestyle",
    "Technology",
    "Food & Beverage",
    "Supermarket",
    "Kids",
    "Entertainment",
    "Home",
}


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


def normalize_category(label):
    if not label:
        return "Services"
    text = label.lower()
    if any(key in text for key in ["food", "dine", "restaurant", "cafe", "beverage", "dessert", "bakery", "snack"]):
        return "Food & Beverage"
    if any(key in text for key in ["fashion", "apparel", "clothing", "gold", "jewelry", "shoe", "bag"]):
        return "Fashion"
    if any(key in text for key in ["beauty", "cosmetic", "clinic", "spa", "massage", "hair", "nail"]):
        return "Beauty"
    if any(key in text for key in ["tech", "camera", "computer", "mobile", "electronics", "gadget"]):
        return "Electronics"
    if any(key in text for key in ["sport", "fitness"]):
        return "Sports"
    if any(key in text for key in ["book", "education"]):
        return "Books"
    if any(key in text for key in ["home", "living", "lifestyle"]):
        return "Home & Garden"
    if any(key in text for key in ["health", "pharmacy"]):
        return "Health & Pharmacy"
    if any(key in text for key in ["entertainment", "cinema"]):
        return "Entertainment"
    if any(key in text for key in ["kids", "toys"]):
        return "Kids & Baby"
    return "Services"


def parse_tokens(tokens):
    entries = []
    current_category = None
    pending_shop = None
    started = False

    for token in tokens:
        if token in SKIP_TOKENS:
            if token == "ALL SHOPS":
                started = True
            continue
        if not started:
            continue

        if token in CATEGORY_HEADERS:
            current_category = token
            continue

        if FLOOR_TOKEN_RE.match(token):
            if pending_shop:
                entries.append({
                    "name": pending_shop,
                    "floor": token.upper(),
                    "categoryLabel": current_category,
                })
                pending_shop = None
            continue

        # Treat remaining tokens as shop names
        pending_shop = token

    return entries


def main():
    html = fetch_html()
    parser = TextCollector()
    parser.feed(html)
    entries = parse_tokens(parser.tokens)

    floors = {}
    for entry in entries:
        floor_label = entry.get("floor", "UNKNOWN")
        store = {
            "name": entry["name"],
            "category": normalize_category(entry.get("categoryLabel")),
            "categoryLabel": entry.get("categoryLabel"),
            "floorId": floor_label.replace("F", ""),
            "floorLabel": floor_label,
            "status": "Active",
        }
        floors.setdefault(floor_label, []).append(store)

    floor_entries = []
    for floor_label, stores in floors.items():
        order = 0
        match = re.match(r"^(B\\d+|GF|G|UG|LG|MF|M|\\d{1,2})", floor_label, re.IGNORECASE)
        if match:
            value = match.group(1).upper()
            if value.startswith("B"):
                order = -int(value[1:])
            elif value in {"G", "GF", "UG", "LG", "M", "MF"}:
                order = 0
            else:
                order = int(value)
        floor_entries.append({
            "id": floor_label.replace("F", ""),
            "label": floor_label,
            "name": floor_label,
            "order": order,
            "stores": stores,
        })

    floor_entries.sort(key=lambda item: item.get("order", 0))

    retrieved_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    output = {
        "mallSlug": "central-chaengwattana",
        "source": {
            "name": "Central Chaengwattana Shop Directory (official)",
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
    out_path = os.path.join(out_dir, "central-chaengwattana.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Extracted {output['storeCount']} stores for Central Chaengwattana")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
