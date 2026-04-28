INSERT INTO price_set (id, created_at, updated_at)
VALUES ('pset_01KQ9DQ0F5WJ2KJV7HRSPZX552', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
VALUES ('price_shipping_01', 'pset_01KQ9DQ0F5WJ2KJV7HRSPZX552', 'usd', 0, '{"value": "0", "precision": 20}', 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
