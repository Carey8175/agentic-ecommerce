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

export function createSession(opts: {
  customer_id?: string
  surface?: string
  title?: string
}): Session {
  const db = getDb()
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

export function listSessions(customer_id: string | null, limit = 50): Session[] {
  if (customer_id) {
    return getDb()
      .prepare("SELECT * FROM sessions WHERE customer_id = ? ORDER BY updated_at DESC LIMIT ?")
      .all(customer_id, limit) as Session[]
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
    "INSERT INTO messages (id, session_id, role, content, tool_calls, tool_name, tool_call_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, msg.session_id, msg.role, msg.content, msg.tool_calls ?? null, msg.tool_name ?? null, msg.tool_call_id ?? null, now)
  touchSession(msg.session_id)
  return db.prepare("SELECT * FROM messages WHERE id = ?").get(id) as Message
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
