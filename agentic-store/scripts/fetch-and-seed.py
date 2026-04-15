"""
Fetches 500 products from Shopify/product-catalogue HuggingFace dataset
and inserts them into the Medusa agentic_store PostgreSQL database.

Requirements:
  pip install requests psycopg2-binary

Usage:
  python fetch-and-seed.py
"""

import requests
import psycopg2
import uuid
import re
import json
import time
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────
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
BATCH_SIZE = 100   # HF API max per request
# ─────────────────────────────────────────────────────────────────────────────


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text[:80]


def make_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:26].upper()}"


def guess_price(category: str) -> tuple[int, int]:
    """Return (usd_amount, eur_amount) based on category keywords."""
    cat = category.lower()
    if any(k in cat for k in ["electronic", "computer", "phone", "camera", "tv", "audio"]):
        usd = round((50 + hash(category) % 450) / 5) * 5
    elif any(k in cat for k in ["jewelry", "jewellery", "watch", "gold", "silver"]):
        usd = round((30 + hash(category) % 270) / 5) * 5
    elif any(k in cat for k in ["apparel", "clothing", "shoe", "bag", "fashion"]):
        usd = round((15 + hash(category) % 135) / 5) * 5
    elif any(k in cat for k in ["grocery", "food", "beverage", "drink"]):
        usd = round((3 + hash(category) % 27) / 1) * 1
    elif any(k in cat for k in ["toy", "game", "baby", "child", "kid"]):
        usd = round((10 + hash(category) % 90) / 5) * 5
    elif any(k in cat for k in ["sport", "outdoor", "fitness", "gym"]):
        usd = round((20 + hash(category) % 180) / 5) * 5
    elif any(k in cat for k in ["home", "kitchen", "garden", "tool", "furniture"]):
        usd = round((15 + hash(category) % 185) / 5) * 5
    elif any(k in cat for k in ["beauty", "health", "personal care", "cosmetic"]):
        usd = round((8 + hash(category) % 92) / 2) * 2
    elif any(k in cat for k in ["pet", "animal"]):
        usd = round((10 + hash(category) % 90) / 5) * 5
    elif any(k in cat for k in ["art", "craft", "hobby", "stationery", "book"]):
        usd = round((5 + hash(category) % 95) / 5) * 5
    else:
        usd = round((10 + hash(category) % 90) / 5) * 5

    eur = round(usd * 0.92)
    return usd, eur   # store as whole units (not cents)


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


def seed():
    print("Connecting to database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    now = datetime.now(timezone.utc)

    # ── Fetch shipping profile id ─────────────────────────────────────────────
    cur.execute("SELECT id FROM shipping_profile LIMIT 1;")
    row = cur.fetchone()
    if not row:
        print("ERROR: No shipping profile found. Run the main seed first.")
        return
    shipping_profile_id = row[0]
    print(f"Using shipping profile: {shipping_profile_id}")

    # ── Fetch sales channel id ────────────────────────────────────────────────
    cur.execute("SELECT id FROM sales_channel WHERE name = 'Default Sales Channel' LIMIT 1;")
    row = cur.fetchone()
    if not row:
        print("ERROR: No Default Sales Channel found. Run the main seed first.")
        return
    sales_channel_id = row[0]
    print(f"Using sales channel: {sales_channel_id}")

    # ── Collect 500 rows from HuggingFace ─────────────────────────────────────
    print(f"\nFetching {TARGET_COUNT} products from HuggingFace...")
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

    products = all_rows[:TARGET_COUNT]
    print(f"Got {len(products)} products. Inserting into DB...\n")

    inserted = 0
    seen_handles = set()

    for i, item in enumerate(products):
        row_data = item["row"]
        title = row_data.get("product_title", f"Product {i+1}").strip()
        description = row_data.get("product_description", "").strip() or "Quality product."
        category = row_data.get("ground_truth_category", "General") or "General"
        brand = row_data.get("ground_truth_brand", "") or ""
        image_src = row_data.get("product_image", {}) or {}
        image_url = image_src.get("src", "") if isinstance(image_src, dict) else ""

        # unique handle
        base_handle = slugify(title) or f"product-{i+1}"
        handle = base_handle
        suffix = 1
        while handle in seen_handles:
            handle = f"{base_handle}-{suffix}"
            suffix += 1
        seen_handles.add(handle)

        subtitle = brand if brand else category.split(">")[-1].strip()
        usd_amount, eur_amount = guess_price(category)

        # IDs
        product_id = make_id("prod")
        variant_id = make_id("variant")
        price_set_id = make_id("ps")
        price_id_usd = make_id("price")
        price_id_eur = make_id("price")
        link_id = make_id("pvps")
        img_id = make_id("img")
        sku = f"SKU-{i+1:05d}"

        try:
            # 1. product
            cur.execute("""
                INSERT INTO product (id, title, handle, subtitle, description, is_giftcard, status, thumbnail, weight, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, false, 'published', %s, 500, %s, %s)
            """, (product_id, title, handle, subtitle, description, image_url or None, now, now))

            # 2. product_category link (optional — skip if no category table match)
            # We skip product_category linking to keep it simple

            # 3. image
            if image_url:
                cur.execute("""
                    INSERT INTO image (id, url, rank, product_id, created_at, updated_at)
                    VALUES (%s, %s, 0, %s, %s, %s)
                """, (img_id, image_url, product_id, now, now))

            # 4. variant
            cur.execute("""
                INSERT INTO product_variant (id, title, sku, allow_backorder, manage_inventory, variant_rank, product_id, created_at, updated_at)
                VALUES (%s, 'Default', %s, false, true, 0, %s, %s, %s)
            """, (variant_id, sku, product_id, now, now))

            # 5. price_set
            cur.execute("""
                INSERT INTO price_set (id, created_at, updated_at)
                VALUES (%s, %s, %s)
            """, (price_set_id, now, now))

            # 6. prices (USD + EUR)
            raw_usd = json.dumps({"value": str(usd_amount), "precision": 20})
            raw_eur = json.dumps({"value": str(eur_amount), "precision": 20})

            cur.execute("""
                INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
                VALUES (%s, %s, 'usd', %s, %s, 0, %s, %s)
            """, (price_id_usd, price_set_id, usd_amount, raw_usd, now, now))

            cur.execute("""
                INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
                VALUES (%s, %s, 'eur', %s, %s, 0, %s, %s)
            """, (price_id_eur, price_set_id, eur_amount, raw_eur, now, now))

            # 7. product_variant_price_set link
            cur.execute("""
                INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (link_id, variant_id, price_set_id, now, now))

            # 8. sales channel link
            sc_link_id = make_id("sc")
            cur.execute("""
                INSERT INTO product_sales_channel (id, product_id, sales_channel_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (sc_link_id, product_id, sales_channel_id, now, now))

            # 9. Shipping Profile Link (Medusa v2 Requirement)
            psp_id = make_id("psp")
            cur.execute("""
                INSERT INTO product_shipping_profile (id, product_id, profile_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (psp_id, product_id, shipping_profile_id, now, now))

            # 10. Inventory Item & Level (Medusa v2 Requirement)
            # Find the default stock location
            cur.execute("SELECT id FROM stock_location LIMIT 1;")
            loc_row = cur.fetchone()
            if loc_row:
                location_id = loc_row[0]
                inv_item_id = make_id("iitem")
                inv_level_id = make_id("ilev")
                pv_inv_id = make_id("pvitem")
                
                # Truncate title for inventory item to prevent UI stretch bugs
                short_title = title[:57] + '...' if len(title) > 60 else title
                
                cur.execute("""
                    INSERT INTO inventory_item (id, title, sku, requires_shipping, created_at, updated_at)
                    VALUES (%s, %s, %s, true, %s, %s)
                """, (inv_item_id, short_title, sku, now, now))

                # Proper JSON blob for Medusa v2 quantities
                raw_qty = json.dumps({"value": "100", "precision": 20})
                zero_qty = json.dumps({"value": "0", "precision": 20})

                cur.execute("""
                    INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, raw_stocked_quantity, reserved_quantity, raw_reserved_quantity, incoming_quantity, raw_incoming_quantity, created_at, updated_at)
                    VALUES (%s, %s, %s, 100, %s, 0, %s, 0, %s, %s, %s)
                """, (inv_level_id, inv_item_id, location_id, raw_qty, zero_qty, zero_qty, now, now))

                cur.execute("""
                    INSERT INTO product_variant_inventory_item (id, variant_id, inventory_item_id, required_quantity, created_at, updated_at)
                    VALUES (%s, %s, %s, 1, %s, %s)
                """, (pv_inv_id, variant_id, inv_item_id, now, now))

            inserted += 1
            if inserted % 50 == 0:
                conn.commit()
                print(f"  Committed {inserted} products...")

        except Exception as e:
            print(f"  ERROR on product {i+1} '{title}': {e}")
            conn.rollback()

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone! Inserted {inserted} products into agentic_store.")


if __name__ == "__main__":
    seed()
