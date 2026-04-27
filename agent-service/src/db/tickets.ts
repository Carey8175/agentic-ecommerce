import { v4 as uuidv4 } from "uuid"
import { getDb } from "./schema"

export type TicketType = "refund" | "return" | "damaged" | "missing" | "general"
export type TicketStatus = "open" | "pending_customer" | "pending_admin" | "resolved" | "rejected"

export interface SupportTicket {
  id: string
  customer_id: string | null
  customer_email: string | null
  customer_name: string | null
  order_id: string | null
  order_display_id: number | null
  type: TicketType
  status: TicketStatus
  subject: string | null
  session_id: string | null
  created_at: number
  updated_at: number
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_role: "customer" | "admin"
  content: string
  created_at: number
}

export function createTicket(opts: {
  customer_id?: string
  customer_email?: string
  customer_name?: string
  order_id?: string
  order_display_id?: number
  type: TicketType
  subject?: string
  session_id?: string
  initial_message: string
}): SupportTicket {
  const db = getDb()
  const id = uuidv4()
  const now = Math.floor(Date.now() / 1000)

  db.prepare(`
    INSERT INTO support_tickets (id, customer_id, customer_email, customer_name, order_id, order_display_id, type, status, subject, session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
  `).run(id, opts.customer_id ?? null, opts.customer_email ?? null, opts.customer_name ?? null, opts.order_id ?? null, opts.order_display_id ?? null, opts.type, opts.subject ?? null, opts.session_id ?? null, now, now)

  // Add the first customer message
  addTicketMessage({ ticket_id: id, sender_role: "customer", content: opts.initial_message })

  return db.prepare("SELECT * FROM support_tickets WHERE id = ?").get(id) as SupportTicket
}

export function getTicket(id: string): SupportTicket | null {
  return (getDb().prepare("SELECT * FROM support_tickets WHERE id = ?").get(id) as SupportTicket) ?? null
}

export function listTickets(customer_id: string | null, limit = 20): SupportTicket[] {
  if (customer_id) {
    return getDb().prepare("SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY updated_at DESC LIMIT ?").all(customer_id, limit) as SupportTicket[]
  }
  return getDb().prepare("SELECT * FROM support_tickets ORDER BY updated_at DESC LIMIT ?").all(limit) as SupportTicket[]
}

export function listAllTickets(status?: string, limit = 50): SupportTicket[] {
  if (status) {
    return getDb().prepare("SELECT * FROM support_tickets WHERE status = ? ORDER BY updated_at DESC LIMIT ?").all(status, limit) as SupportTicket[]
  }
  return getDb().prepare("SELECT * FROM support_tickets ORDER BY updated_at DESC LIMIT ?").all(limit) as SupportTicket[]
}

export function updateTicketStatus(id: string, status: TicketStatus): void {
  const now = Math.floor(Date.now() / 1000)
  getDb().prepare("UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?").run(status, now, id)
}

export function addTicketMessage(opts: { ticket_id: string; sender_role: "customer" | "admin"; content: string }): TicketMessage {
  const db = getDb()
  const id = uuidv4()
  const now = Math.floor(Date.now() / 1000)
  db.prepare("INSERT INTO ticket_messages (id, ticket_id, sender_role, content, created_at) VALUES (?, ?, ?, ?, ?)").run(id, opts.ticket_id, opts.sender_role, opts.content, now)
  // Update ticket timestamp and status
  const newStatus = opts.sender_role === "admin" ? "pending_customer" : "pending_admin"
  db.prepare("UPDATE support_tickets SET updated_at = ?, status = CASE WHEN status NOT IN ('resolved','rejected') THEN ? ELSE status END WHERE id = ?").run(now, newStatus, opts.ticket_id)
  return db.prepare("SELECT * FROM ticket_messages WHERE id = ?").get(id) as TicketMessage
}

export function getTicketMessages(ticket_id: string): TicketMessage[] {
  return getDb().prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC").all(ticket_id) as TicketMessage[]
}

export function deleteTicket(id: string): void {
  const db = getDb()
  db.prepare("DELETE FROM ticket_messages WHERE ticket_id = ?").run(id)
  db.prepare("DELETE FROM support_tickets WHERE id = ?").run(id)
}
