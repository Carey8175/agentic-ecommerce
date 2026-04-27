import { Router, Request, Response } from "express"
import { createTicket, getTicket, listTickets, listAllTickets, updateTicketStatus, addTicketMessage, getTicketMessages, deleteTicket } from "../db/tickets"

const router = Router()

// Customer: list their tickets
router.get("/", (req: Request, res: Response) => {
  const customerId = req.headers["x-customer-id"] as string | undefined
  const tickets = listTickets(customerId ?? null)
  res.json({ tickets })
})

// Admin: list all tickets (no customer-id header required)
router.get("/admin", (req: Request, res: Response) => {
  const status = req.query.status as string | undefined
  const tickets = listAllTickets(status)
  res.json({ tickets })
})

// Create a ticket (customer)
router.post("/", (req: Request, res: Response) => {
  const customerId = req.headers["x-customer-id"] as string | undefined
  const { order_id, order_display_id, type, subject, initial_message, customer_email, customer_name, session_id } = req.body
  if (!initial_message || !type) {
    res.status(400).json({ error: "type and initial_message are required" })
    return
  }
  const ticket = createTicket({
    customer_id: customerId,
    customer_email,
    customer_name,
    order_id,
    order_display_id,
    type,
    subject,
    session_id,
    initial_message,
  })
  res.json({ ticket })
})

// Get a single ticket with messages
router.get("/:id", (req: Request, res: Response) => {
  const ticket = getTicket(req.params.id)
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return }
  const messages = getTicketMessages(req.params.id)
  res.json({ ticket, messages })
})

// Reply to a ticket (customer or admin)
router.post("/:id/messages", (req: Request, res: Response) => {
  const ticket = getTicket(req.params.id)
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return }
  const { content, sender_role } = req.body
  if (!content) { res.status(400).json({ error: "content is required" }); return }
  const role = sender_role === "admin" ? "admin" : "customer"
  const message = addTicketMessage({ ticket_id: req.params.id, sender_role: role, content })
  res.json({ message })
})

// Delete a ticket and all its messages (admin)
router.delete("/:id", (req: Request, res: Response) => {
  const ticket = getTicket(req.params.id)
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return }
  deleteTicket(req.params.id)
  res.json({ success: true })
})

// Update ticket status (admin)
router.patch("/:id/status", (req: Request, res: Response) => {
  const { status } = req.body
  const allowed = ["open", "pending_customer", "pending_admin", "resolved", "rejected", "closed"]
  if (!allowed.includes(status)) { res.status(400).json({ error: "Invalid status" }); return }
  updateTicketStatus(req.params.id, status)
  res.json({ success: true })
})

export default router
