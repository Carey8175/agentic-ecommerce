"""
Fetches the same 500 products from HuggingFace, extracts their categories,
creates product_category records, and links each product by SKU.

Usage:
  python enrich-categories.py
"""

import requests
import psycopg2
import uuid
import re
import time
from datetime import datetime, timezone

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "agentic_store",
    "user": "postgres",
    "password": "admin123$",
}

DATASET_API = "https://datasets-server.huggingface.co/rows"
DATASET_PARAMS = {
    "dataset": "Shopify/product-catalogue",
    "config": "default",
    "split": "train",
}

TARGET_COUNT = 500
BATCH_SIZE = 100


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text[:80]


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:26].upper()}"


def fetch_rows(offset: int, limit: int) -> list[dict]:
    params = {**DATASET_PARAMS, "offset": offset, "limit": limit}
    for attempt in range(3):
        try:
            r = requests.get(DATASET_API, params=params, timeout=30)
            r.raise_for_status()
            return r.json().get("rows", [])
        except Exception as e:
            print(f"  Retry {attempt+1}/3 for offset={offset}: {e}")
            time.sleep(2)
    return []


def enrich():
    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    now = datetime.now(timezone.utc)

    # Fetch all 500 rows
    print(f"Fetching {TARGET_COUNT} products from HuggingFace...")
    all_rows = []
    offset = 0
    while len(all_rows) < TARGET_COUNT:
        batch = fetch_rows(offset, BATCH_SIZE)
        if not batch:
            break
        all_rows.extend(batch)
        print(f"  Fetched {len(all_rows)} so far...")
        offset += BATCH_SIZE
        time.sleep(0.5)

    rows = all_rows[:TARGET_COUNT]
    print(f"Got {len(rows)} rows.\n")

    # Build SKU -> category map
    # SKU was stored as SKU-00001 (i+1 with 5 digits, 1-indexed)
    sku_category = {}
    for i, item in enumerate(rows):
        row_data = item["row"]
        category = row_data.get("ground_truth_category", "") or ""
        sku = f"SKU-{i+1:05d}"
        sku_category[sku] = category.strip()

    # Collect unique top-level categories (first segment before ">")
    unique_categories = set()
    for cat in sku_category.values():
        if cat:
            top = cat.split(">")[0].strip()
            if top:
                unique_categories.add(top)

    print(f"Found {len(unique_categories)} unique top-level categories.")

    # Insert categories (skip if handle already exists)
    cat_name_to_id = {}
    for cat_name in sorted(unique_categories):
        handle = slugify(cat_name)
        if not handle:
            continue
        # Check if already exists
        cur.execute("SELECT id FROM product_category WHERE handle = %s AND deleted_at IS NULL", (handle,))
        existing = cur.fetchone()
        if existing:
            cat_name_to_id[cat_name] = existing[0]
            continue
        cat_id = make_id("pcat")
        cur.execute("""
            INSERT INTO product_category (id, name, handle, mpath, is_active, is_internal, rank, created_at, updated_at)
            VALUES (%s, %s, %s, %s, true, false, 0, %s, %s)
        """, (cat_id, cat_name, handle, cat_id + ".", now, now))
        cat_name_to_id[cat_name] = cat_id

    conn.commit()
    print(f"Inserted/found {len(cat_name_to_id)} categories.\n")

    # Link products to categories
    linked = 0
    skipped = 0
    for sku, category in sku_category.items():
        if not category:
            skipped += 1
            continue
        top = category.split(">")[0].strip()
        cat_id = cat_name_to_id.get(top)
        if not cat_id:
            skipped += 1
            continue

        # Look up product by SKU
        cur.execute("""
            SELECT pv.product_id FROM product_variant pv WHERE pv.sku = %s LIMIT 1
        """, (sku,))
        row = cur.fetchone()
        if not row:
            skipped += 1
            continue
        product_id = row[0]

        # Insert link (ignore if already exists)
        cur.execute("""
            INSERT INTO product_category_product (product_id, product_category_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (product_id, cat_id))
        linked += 1

        if linked % 100 == 0:
            conn.commit()
            print(f"  Linked {linked} products...")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone! Linked {linked} products to categories. Skipped {skipped}.")


if __name__ == "__main__":
    enrich()
