import json
import os
import re
from urllib.request import Request, urlopen

DIRECTORY_URL = "https://www.siamparagon.co.th/directory"

def fetch_html():
    req = Request(DIRECTORY_URL, headers={"User-Agent": "Mozilla/5.0"})
    return urlopen(req, timeout=30).read().decode("utf-8", "ignore")

def extract_payload(html: str) -> str:
    pattern = re.compile(r'self.__next_f.push\(\[(\d+),"(.*?)"\]\)', re.S)
    payload = ""
    for _, chunk in pattern.findall(html):
        payload += chunk.encode("utf-8").decode("unicode_escape")
    return payload

def extract_occupants(payload: str) -> dict:
    key = '"occupantsByCategory":'
    idx = payload.find(key)
    if idx == -1:
        raise RuntimeError("occupantsByCategory not found in payload")
    start = idx + len(key)
    while start < len(payload) and payload[start].isspace():
        start += 1
    if payload[start] != '{':
        raise RuntimeError("Expected object for occupantsByCategory")
    level = 0
    end = start
    for i in range(start, len(payload)):
        ch = payload[i]
        if ch == '{':
            level += 1
        elif ch == '}':
            level -= 1
            if level == 0:
                end = i + 1
                break
    return json.loads(payload[start:end])

def normalize_level(level: str) -> str:
    if not level:
        return ""
    cleaned = str(level).strip().upper()
    if cleaned == "GF":
        return "G"
    return cleaned

def main():
    html = fetch_html()
    payload = extract_payload(html)
    occupants = extract_occupants(payload)

    list_items = []
    for category in ["shop", "dine", "seeAndDo"]:
        for entry in occupants.get(category, []):
            props = entry.get("properties", {})
            name = (props.get("name", {}) or {}).get("en", "").strip()
            floor = normalize_level(props.get("level_name", ""))
            keywords = props.get("keywords", [])
            list_items.append({
                "name": name,
                "floor": floor,
                "category": category,
                "keywords": keywords,
            })

    output = {
        "source": DIRECTORY_URL,
        "retrievedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "count": len(list_items),
        "stores": [item for item in list_items if item["name"]],
    }

    out_dir = os.path.join(os.getcwd(), "data", "derived")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "siamparagon-directory.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Extracted {output['count']} entries")
    print(f"Output: {out_path}")

if __name__ == "__main__":
    main()
