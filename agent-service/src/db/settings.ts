import { getDb } from "./schema"

export interface CustomerSettings {
  customer_id: string
  one_click_checkout_enabled: boolean
  saved_address_id: string | null
  history_window: number
  updated_at: number
}

export function getSettings(customer_id: string): CustomerSettings {
  const db = getDb()
  const row = db.prepare("SELECT * FROM customer_settings WHERE customer_id = ?").get(customer_id) as any
  if (!row) {
    return { customer_id, one_click_checkout_enabled: false, saved_address_id: null, history_window: 30, updated_at: 0 }
  }
  return { ...row, one_click_checkout_enabled: row.one_click_checkout_enabled === 1 }
}

export function upsertSettings(
  customer_id: string,
  data: Partial<Omit<CustomerSettings, "customer_id" | "updated_at">>
): CustomerSettings {
  const db = getDb()
  const now = Math.floor(Date.now() / 1000)
  const existing = getSettings(customer_id)
  const merged = { ...existing, ...data }

  db.prepare(`
    INSERT INTO customer_settings (customer_id, one_click_checkout_enabled, saved_address_id, history_window, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(customer_id) DO UPDATE SET
      one_click_checkout_enabled = excluded.one_click_checkout_enabled,
      saved_address_id = excluded.saved_address_id,
      history_window = excluded.history_window,
      updated_at = excluded.updated_at
  `).run(customer_id, merged.one_click_checkout_enabled ? 1 : 0, merged.saved_address_id ?? null, merged.history_window, now)

  return getSettings(customer_id)
}
