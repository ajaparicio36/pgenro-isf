#!/usr/bin/env python3
"""
Generate filtered_municipalities.json from PSGC shapefiles and municipality CSV.

This script reads the barangay-level GeoJSON (province_barangays.json) and the
PSGC municipality reference CSV (PH_Adm3_MuniCities.csv) to produce the seed
data file expected by src/seed/seed.ts.

Usage:
    # Using the existing GeoJSON (Iloilo province only):
    python3 src/seed/generate-filtered-municipalities.py

    # OR: generate from a different GeoJSON for a different province:
    python3 src/seed/generate-filtered-municipalities.py \\
        --geojson path/to/other_province_barangays.json \\
        --csv /tmp/PH_Adm3_MuniCities.csv \\
        --output public/filtered_municipalities.json

Requirements:
    - The GeoJSON must have features with properties: adm4_psgc, adm4_en
    - The CSV must have columns: adm3_psgc, adm3_en
    - Download the CSV from:
      https://raw.githubusercontent.com/altcoder/philippines-psgc-shapefiles/main/dist/PH_Adm3_MuniCities.csv
"""

import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path


def load_municipality_names(csv_path: str) -> dict[int, str]:
    """Load municipality PSGC code -> name mapping from CSV."""
    mun_name: dict[int, str] = {}
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = int(row["adm3_psgc"])
            name = row["adm3_en"]
            mun_name[code] = name
    return mun_name


def load_barangays(geojson_path: str) -> dict[int, list[dict]]:
    """Load barangays from GeoJSON, grouped by municipality code (first 6 digits of adm4_psgc)."""
    with open(geojson_path, encoding="utf-8") as f:
        geojson = json.load(f)

    features = geojson if isinstance(geojson, list) else geojson.get("features", [])

    muns: dict[int, list[dict]] = defaultdict(list)
    for feat in features:
        props = feat["properties"]
        barangay_code = props.get("adm4_psgc")
        barangay_name = props.get("adm4_en", "")
        if not barangay_code:
            continue

        mun_code = int(str(barangay_code)[:6])
        muns[mun_code].append(
            {
                "barangay_code": barangay_code,
                "barangay_name": barangay_name,
            }
        )

    return muns


def generate(
    geojson_path: str,
    csv_path: str,
    output_path: str,
) -> None:
    mun_names = load_municipality_names(csv_path)
    barangays = load_barangays(geojson_path)

    result = []
    for mun_code_int in sorted(barangays.keys()):
        mun_code_padded = int(f"{mun_code_int:06d}000")  # e.g. 603001 -> 603001000
        name = mun_names.get(
            mun_code_padded, f"Unknown-Municipality-{mun_code_int:06d}"
        )

        entries = []
        for b in barangays[mun_code_int]:
            entries.append(
                {
                    "municipality_code": b["barangay_code"],
                    "municipality_name": name,
                    "barangay_code": b["barangay_code"],
                    "barangay_name": b["barangay_name"],
                }
            )

        result.append(
            {
                "code": mun_code_int,
                "name": name,
                "barangays": entries,
            }
        )

    output = [{"result": result}]
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    total_barangays = sum(len(m["barangays"]) for m in result)
    print(f"Written {output_path}")
    print(f"  {len(result)} municipalities, {total_barangays} barangays")

    # Warn about any municipality names that couldn't be resolved
    unknown = [
        m["name"]
        for m in result
        if m["name"].startswith("Unknown-")
    ]
    if unknown:
        print(f"\n  WARNING: {len(unknown)} municipalities could not be resolved:")
        for u in unknown:
            code = u.split("-")[-1]
            print(f"    PSGC prefix {code} - add entry in CSV or use PSGC reference")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate filtered_municipalities.json for Prisma seed"
    )
    parser.add_argument(
        "--geojson",
        default="public/data/province_barangays.json",
        help="Path to province_barangays.geojson (default: public/data/province_barangays.json)",
    )
    parser.add_argument(
        "--csv",
        default="/tmp/PH_Adm3_MuniCities.csv",
        help="Path to PH_Adm3_MuniCities.csv (download from altcoder/philippines-psgc-shapefiles)",
    )
    parser.add_argument(
        "--output",
        default="public/filtered_municipalities.json",
        help="Output path (default: public/filtered_municipalities.json)",
    )
    args = parser.parse_args()

    if not Path(args.csv).exists():
        print(f"CSV file not found: {args.csv}")
        print("Download it from:")
        print("  https://raw.githubusercontent.com/altcoder/philippines-psgc-shapefiles/main/dist/PH_Adm3_MuniCities.csv")
        sys.exit(1)

    generate(args.geojson, args.csv, args.output)
