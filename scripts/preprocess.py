#!/usr/bin/env python3
import csv
import json
import re
from pathlib import Path

# Where your raw CSVs live
INPUT_DIR = Path("public")
# Where to write the merged JSON
OUTPUT_FILE = INPUT_DIR / "data" / "billionaires.json"
OUTPUT_FILE.parent.mkdir(exist_ok=True, parents=True)

def parse_net_worth(nw: str) -> float:
    """Extract the numeric part of '12.3 B' → 12.3"""
    m = re.search(r"(\d+(?:\.\d+)?)\s*B", nw or "")
    return float(m.group(1)) if m else 0.0

def parse_industries(raw: str) -> list[str]:
    """Turn "['A','B']" or "A" into a Python list of strings"""
    if not raw:
        return []
    raw = raw.strip()
    if raw.startswith("[") and raw.endswith("]"):
        # remove [ ] and split on commas
        items = raw[1:-1].split(",")
        return [i.strip().strip("'\"").replace("&#38;", "&") for i in items]
    return [raw]

all_billionaires = []

for year in range(1997, 2025):
    csv_path = INPUT_DIR / f"billionaires_{year}.csv"
    if not csv_path.exists():
        continue
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            industries = parse_industries(row.get("business_industries", ""))
            record = {
                "name": row.get("full_name") or f"{row.get('first_name','')} {row.get('last_name','')}".strip(),
                "age": int(row["age"]) if row.get("age", "").isdigit() else None,
                "netWorth": parse_net_worth(row.get("net_worth", "")),
                "industry": row.get("business_category") or (industries[0] if industries else "Unknown"),
                "sourceOfWealth": ", ".join(industries),
                "title": row.get("position_in_organization", ""),
                "organization": row.get("organization_name", ""),
                "isSelfMade": row.get("self_made", "").lower() == "true",
                "year": int(row["year"]) if row.get("year", "").isdigit() else None,
                "wealthStatus": row.get("wealth_status", "")
                # … add any other fields you need …
            }
            all_billionaires.append(record)

# Write out one big JSON file
with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    json.dump(all_billionaires, out, ensure_ascii=False, indent=2)

print(f"Wrote {len(all_billionaires)} records to {OUTPUT_FILE}")
