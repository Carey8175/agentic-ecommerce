import { v4 as uuidv4 } from "uuid"
import { getDb } from "./schema"

export type MessageRole = "user" | "assistant" | "tool"

export interface Message {
  id: string
  session_id: string
  role: MessageRole
  content: string
  tool_calls?: string | null
  tool_name?: string | null
  tool_call_id?: string | null
  ui_data?: string | null
  created_at: number
}

export interface Session {
  id: string
  customer_id: string | null
  title: string | null
  surface: string
  created_at: number
  updated_at: number
}

const SESSION_LIMIT = 6

function pruneOldSessions(customer_id: string | null) {
  const db = getDb()
  const sessions = customer_id
    ? db.prepare("SELECT id FROM sessions WHERE customer_id = ? ORDER BY updated_at DESC").all(customer_id) as { id: string }[]
    : db.prepare("SELECT id FROM sessions WHERE customer_id IS NULL ORDER BY updated_at DESC").all() as { id: string }[]

  if (sessions.length >= SESSION_LIMIT) {
    const toDelete = sessions.slice(SESSION_LIMIT - 1).map(s => s.id)
    for (const sid of toDelete) {
      db.prepare("DELETE FROM messages WHERE session_id = ?").run(sid)
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sid)
    }
  }
}

export function createSession(opts: {
  customer_id?: string
  surface?: string
  title?: string
}): Session {
  const db = getDb()
  pruneOldSessions(opts.customer_id ?? null)
  const id = uuidv4()
  const now = Math.floor(Date.now() / 1000)
  db.prepare(
    "INSERT INTO sessions (id, customer_id, surface, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, opts.customer_id ?? null, opts.surface ?? "floating", opts.title ?? null, now, now)
  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Session
}

export function getSession(id: string): Session | null {
  return (getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Session) ?? null
}

export function listSessions(customer_id: string | null, limit = 50, surface?: string): Session[] {
  if (customer_id) {
    return getDb()
      .prepare("SELECT * FROM sessions WHERE customer_id = ? ORDER BY updated_at DESC LIMIT ?")
      .all(customer_id, limit) as Session[]
  } else if (surface) {
    return getDb()
      .prepare("SELECT * FROM sessions WHERE customer_id IS NULL AND surface = ? ORDER BY updated_at DESC LIMIT ?")
      .all(surface, limit) as Session[]
  } else {
    return getDb()
      .prepare("SELECT * FROM sessions WHERE customer_id IS NULL ORDER BY updated_at DESC LIMIT ?")
      .all(limit) as Session[]
  }
}

export function updateSessionTitle(id: string, title: string) {
  const now = Math.floor(Date.now() / 1000)
  getDb().prepare("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?").run(title, now, id)
}

export function touchSession(id: string) {
  const now = Math.floor(Date.now() / 1000)
  getDb().prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(now, id)
}

export function appendMessage(msg: Omit<Message, "id" | "created_at">): Message {
  const db = getDb()
  const id = uuidv4()
  const now = Math.floor(Date.now() / 1000)
  db.prepare(
    "INSERT INTO messages (id, session_id, role, content, tool_calls, tool_name, tool_call_id, ui_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, msg.session_id, msg.role, msg.content, msg.tool_calls ?? null, msg.tool_name ?? null, msg.tool_call_id ?? null, msg.ui_data ?? null, now)
  touchSession(msg.session_id)
  return db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as Message
}

export function updateMessageUiData(id: string, ui_data: string) {
  getDb().prepare("UPDATE messages SET ui_data = ? WHERE id = ?").run(ui_data, id)
}

export function getMessages(session_id: string, limit = 30): Message[] {
  const db = getDb()
  const rows = db
    .prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(session_id, limit) as Message[]
  return rows.reverse()
}

export function getSessionMessages(session_id: string): Message[] {
  return getDb()
    .prepare("SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC")
    .all(session_id) as Message[]
}
