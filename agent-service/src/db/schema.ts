// Uses Node.js 22+ built-in sqlite (node:sqlite) — no native build required
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite")
import path from "path"

const DB_PATH = path.join(__dirname, "../../agent.db")

let db: any

export function getDb(): any {
  if (!db) {
    db = new DatabaseSync(DB_PATH)
    db.exec("PRAGMA journal_mode = WAL")
    db.exec("PRAGMA foreign_keys = ON")
    initSchema(db)
  }
  return db
}

function initSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      title TEXT,
      surface TEXT NOT NULL DEFAULT 'floating',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      tool_name TEXT,
      tool_call_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id, updated_at);

    CREATE TABLE IF NOT EXISTS customer_settings (
      customer_id TEXT PRIMARY KEY,
      one_click_checkout_enabled INTEGER NOT NULL DEFAULT 0,
      saved_address_id TEXT,
      history_window INTEGER NOT NULL DEFAULT 30,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_email TEXT,
      customer_name TEXT,
      order_id TEXT,
      order_display_id INTEGER,
      type TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'open',
      subject TEXT,
      session_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id, updated_at);
    CREATE INDEX IF NOT EXISTS idx_ticket_messages ON ticket_messages(ticket_id, created_at);

    CREATE TABLE IF NOT EXISTS tryon_jobs (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      product TEXT NOT NULL,
      context_image_used TEXT NOT NULL,
      image_url TEXT,
      error TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_tryon_jobs_customer ON tryon_jobs(customer_id, created_at);
  `)

  // Migrations — safe to run repeatedly
  try { db.exec("ALTER TABLE messages ADD COLUMN ui_data TEXT") } catch { /* already exists */ }
}
