"""
Refreshes expired HuggingFace image URLs for imported products.

The HuggingFace datasets-server returns signed (expiring) CloudFront URLs.
This script re-fetches fresh URLs for the same row offsets and updates the DB.

Requirements:
  pip install requests psycopg2-binary

Usage:
  python refresh-images.py
"""

import requests
import psycopg2
import time
import re
from urllib.parse import urlparse, parse_qs

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

BATCH_SIZE = 100
HF_HOST = "datasets-server.huggingface.co"


def extract_row_index(url: str) -> int | None:
    """
    HuggingFace signed URLs follow the pattern:
      /cached-assets/.../default/train/{ROW_INDEX}/product_image/image.jpg?...
    Extract the row index so we know which HF row to re-fetch.
    """
    match = re.search(r"/train/(\d+)/product_image/", url)
    if match:
        return int(match.group(1))
    return None


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


def refresh():
    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # Find all products with HuggingFace thumbnails
    cur.execute("""
        SELECT id, thumbnail FROM product
        WHERE thumbnail LIKE %s
        ORDER BY created_at
    """, (f"%{HF_HOST}%",))
    products = cur.fetchall()

    if not products:
        print("No HuggingFace thumbnails found — nothing to refresh.")
        cur.close()
        conn.close()
        return

    print(f"Found {len(products)} products with HuggingFace image URLs.")

    # Map row_index -> product_id so we know what to update
    index_to_product: dict[int, str] = {}
    no_index: list[str] = []

    for product_id, thumbnail in products:
        idx = extract_row_index(thumbnail)
        if idx is not None:
            index_to_product[idx] = product_id
        else:
            no_index.append(product_id)

    if no_index:
        print(f"  Warning: {len(no_index)} products have unrecognised URL patterns — skipping.")

    if not index_to_product:
        print("Could not extract row indices from any URL. Exiting.")
        cur.close()
        conn.close()
        return

    row_indices = sorted(index_to_product.keys())
    print(f"Row indices range: {row_indices[0]} – {row_indices[-1]}")

    # Fetch fresh rows in batches covering the index range
    min_idx = row_indices[0]
    max_idx = row_indices[-1]

    # Build a map: row_index -> fresh image URL
    fresh_urls: dict[int, str] = {}
    offset = (min_idx // BATCH_SIZE) * BATCH_SIZE

    while offset <= max_idx:
        print(f"  Fetching rows {offset}–{offset + BATCH_SIZE - 1}...")
        batch = fetch_rows(offset, BATCH_SIZE)
        if not batch:
            print(f"  Empty batch at offset {offset}, stopping.")
            break

        for item in batch:
            row_idx = item.get("row_idx")
            if row_idx is None:
                continue
            image_src = item["row"].get("product_image", {}) or {}
            url = image_src.get("src", "") if isinstance(image_src, dict) else ""
            if url:
                fresh_urls[row_idx] = url

        offset += BATCH_SIZE
        time.sleep(0.4)

    print(f"\nGot fresh URLs for {len(fresh_urls)} rows. Updating DB...")

    updated = 0
    skipped = 0

    for row_idx, product_id in index_to_product.items():
        new_url = fresh_urls.get(row_idx)
        if not new_url:
            skipped += 1
            continue

        # Update product thumbnail
        cur.execute(
            "UPDATE product SET thumbnail = %s, updated_at = NOW() WHERE id = %s",
            (new_url, product_id)
        )
        # Update image table
        cur.execute(
            "UPDATE image SET url = %s, updated_at = NOW() WHERE product_id = %s",
            (new_url, product_id)
        )
        updated += 1

        if updated % 50 == 0:
            conn.commit()
            print(f"  Committed {updated} updates...")

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone! Updated {updated} products, skipped {skipped}.")
    print("Image URLs are now fresh. They will expire again in ~24h — re-run this script when needed.")


if __name__ == "__main__":
    refresh()
