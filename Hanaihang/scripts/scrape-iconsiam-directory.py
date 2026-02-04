import json
import os
import re
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE_URL = "https://www.iconsiam.com/iconsiam-service"
DIRECTORY_URL = "https://www.iconsiam.com/en/directory"
USER_AGENT = "Mozilla/5.0 (HanaihangDataBot/1.0)"

CATEGORY_RULES = [
    (["FOOD", "DINING", "RESTAURANT", "CAFE", "DESSERT", "BAR", "BAKERY", "SNACK", "BEVERAGE", "EAT"], "Food & Beverage"),
    (["FASHION", "APPAREL", "CLOTHING", "LUXURY"], "Fashion"),
    (["BEAUTY", "COSMETIC", "FRAGRANCE", "WELLNESS"], "Beauty"),
    (["ELECTRONIC", "GADGET", "TECH"], "Electronics"),
    (["SPORT", "FITNESS"], "Sports"),
    (["BOOK", "EDUCATION"], "Books"),
    (["HOME", "LIVING", "LIFESTYLE", "DEPARTMENT STORE"], "Home & Garden"),
    (["HEALTH", "PHARMACY"], "Health & Pharmacy"),
    (["ENTERTAINMENT", "LEISURE", "HUB OF VDO", "VDO", "CINEMA"], "Entertainment"),
    (["SERVICE", "CO-WORKING", "HALL", "OFFICE"], "Services"),
    (["JEWELRY"], "Jewelry"),
    (["WATCH"], "Watches"),
    (["BAG", "ACCESSORIES", "EYEWEAR", "OPTICAL"], "Bags & Accessories"),
    (["SHOE"], "Shoes"),
    (["KIDS", "TOYS", "HOBBIES"], "Kids & Baby"),
    (["AUTOMOTIVE"], "Automotive"),
    (["BANK", "CREDIT CARD"], "Banking"),
    (["TRAVEL", "TOURIST", "SOUVENIR"], "Travel"),
]


def fetch_json(path: str, params=None):
    url = f"{BASE_URL}/{path}"
    if params:
        query = urlencode(params, doseq=True, safe="[]")
        url = f"{url}?{query}"
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=30) as resp:
        payload = resp.read().decode("utf-8", "ignore")
    return json.loads(payload)


def fetch_all(endpoint: str, params: dict):
    docs = []
    page = 1
    while True:
        payload = dict(params)
        payload["page"] = page
        payload["limit"] = payload.get("limit", 200)
        data = fetch_json(endpoint, payload)
        docs.extend(data.get("docs", []))
        if not data.get("hasNextPage"):
            break
        page = data.get("nextPage") or page + 1
    return docs


def pick_text(value):
    if isinstance(value, dict):
        for key in ("en", "th", "zh"):
            text = value.get(key)
            if text:
                return str(text).strip()
        for text in value.values():
            if text:
                return str(text).strip()
        return None
    if isinstance(value, str):
        return value.strip() or None
    return None


def normalize_category(category_names, endpoint):
    if endpoint == "dinings":
        return "Food & Beverage"
    text = " ".join([str(name).upper() for name in category_names if name])
    for keywords, label in CATEGORY_RULES:
        if any(keyword in text for keyword in keywords):
            return label
    return "Services"


def collect_category_names(categories):
    names = []
    for cat in categories or []:
        raw = cat.get("display_name") or cat.get("name") or {}
        if isinstance(raw, dict):
            for key in ("en", "th", "zh"):
                if raw.get(key):
                    names.append(raw[key])
        elif isinstance(raw, str):
            names.append(raw)
    return [name for name in names if name]


def normalize_time(value):
    if not value:
        return None
    text = str(value).strip().upper()
    text = text.replace("AM", " AM").replace("PM", " PM").strip()
    match = re.match(r"^(\\d{1,2})[.:](\\d{2})\\s*(AM|PM)$", text)
    if match:
        hour = int(match.group(1))
        minute = match.group(2)
        ampm = match.group(3)
        if ampm == "PM" and hour != 12:
            hour += 12
        if ampm == "AM" and hour == 12:
            hour = 0
        return f"{hour:02d}:{minute}"
    match = re.match(r"^(\\d{1,2})[.:](\\d{2})$", text)
    if match:
        return f"{int(match.group(1)):02d}:{match.group(2)}"
    match = re.match(r"^(\\d{1,2}):(\\d{2})$", text)
    if match:
        return f"{int(match.group(1)):02d}:{match.group(2)}"
    return None


def format_hours(opening_hours):
    if not isinstance(opening_hours, dict):
        return None
    if opening_hours.get("same_hours_every_day"):
        open_time = normalize_time(opening_hours.get("open"))
        close_time = normalize_time(opening_hours.get("close"))
        if open_time and close_time:
            return f"{open_time}-{close_time}"
    return None


def main():
    floors_payload = fetch_json("floors", {"limit": 200, "locale": "*"})
    floors = {floor.get("name"): floor for floor in floors_payload.get("docs", [])}

    base_params = {
        "locale": "*",
        "where[status][equals]": "ACTIVE",
        "where[title.en][exists]": "true",
        "sort": "title.en",
    }

    listings = []
    for endpoint in ("shops", "dinings"):
        docs = fetch_all(endpoint, base_params)
        for doc in docs:
            title = doc.get("title") or {}
            name = (title.get("en") or title.get("th") or title.get("zh") or "").strip()
            if not name:
                continue
            floor_name = (doc.get("floor") or {}).get("name") or "UNKNOWN"
            zone = doc.get("location_zone")
            unit = pick_text(doc.get("location_shop_number"))
            phone = None
            contact = doc.get("contact_info")
            if isinstance(contact, dict):
                phone = contact.get("phone") or None
            hours = format_hours(doc.get("opening_hours"))

            category_names = collect_category_names(doc.get("categories"))
            category_label = category_names[0] if category_names else None
            category = normalize_category(category_names, endpoint)

            listings.append({
                "id": f"iconsiam-{endpoint}-{doc.get('id')}",
                "name": name,
                "category": category,
                "categoryLabel": category_label,
                "floorId": floor_name,
                "floorLabel": floor_name,
                "unit": unit or "",
                "phone": phone,
                "hours": hours,
                "status": "Active" if doc.get("status") == "ACTIVE" else "Closed",
                "landmarks": [f"Zone: {zone}"] if zone else [],
                "sourceType": endpoint,
            })

    stores_by_floor = {}
    for store in listings:
        floor_key = store["floorId"]
        stores_by_floor.setdefault(floor_key, []).append(store)

    floor_entries = []
    for floor_name, stores in stores_by_floor.items():
        meta = floors.get(floor_name) or {}
        floor_entries.append({
            "id": floor_name,
            "label": floor_name,
            "name": meta.get("name") or floor_name,
            "order": meta.get("order") if isinstance(meta.get("order"), int) else 0,
            "stores": stores,
        })

    floor_entries.sort(key=lambda item: item.get("order", 0))

    retrieved_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    output = {
        "mallSlug": "iconsiam",
        "source": {
            "name": "ICONSIAM Directory (official)",
            "url": DIRECTORY_URL,
            "retrievedAt": retrieved_at,
            "note": "Data fetched from iconsiam-service/shops and iconsiam-service/dinings endpoints.",
        },
        "retrievedAt": retrieved_at,
        "floorCount": len(floor_entries),
        "storeCount": len(listings),
        "floors": floor_entries,
    }

    out_dir = os.path.join(os.getcwd(), "data", "directories")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "iconsiam.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(listings)} stores for ICONSIAM")
    print(f"Output: {out_path}")


if __name__ == "__main__":
    main()
