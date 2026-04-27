import { Router, Request, Response } from "express"
import { listSessions, getSessionMessages, createSession } from "../db/history"

const router = Router()

// List sessions for a customer (or by surface if no customer)
router.get("/sessions", (req: Request, res: Response) => {
  const customerId = req.headers["x-customer-id"] as string
  const surface = req.query.surface as string | undefined
  if (!customerId) {
    const sessions = listSessions(null, 50, surface)
    res.json({ sessions })
    return
  }
  const sessions = listSessions(customerId, 50)
  res.json({ sessions })
})

// Get all messages for a session (filter out LLM tool calls but include backend UI actions)
router.get("/sessions/:id/messages", (req: Request, res: Response) => {
  const allMessages = getSessionMessages(req.params.id)
  
  // Reconstruct UI state from raw messages.
  // Walk sequentially: each assistant message collects all tool results that
  // immediately follow it (before the next user or assistant message).
  const reconstructed: any[] = []

  for (let i = 0; i < allMessages.length; i++) {
    const m = allMessages[i]

    if (m.role === "user") {
      reconstructed.push({ id: m.id, role: "user", content: m.content })
      continue
    }

    if (m.role === "assistant" && m.content) {
      const assistantMsg: any = { id: m.id, role: "assistant", content: m.content }

      // Prefer ui_data if persisted (new path)
      if ((m as any).ui_data) {
        try {
          const ui = JSON.parse((m as any).ui_data)
          if (ui.products) assistantMsg.products = ui.products
          if (ui.orders) assistantMsg.orders = ui.orders
          if (ui.cartData) assistantMsg.cartData = ui.cartData
          if (ui.checkoutData) assistantMsg.checkoutData = ui.checkoutData
          if (ui.promotions) assistantMsg.promotions = ui.promotions
          if (ui.cancelData) assistantMsg.cancelData = ui.cancelData
          if (ui.ticketData) assistantMsg.ticketData = ui.ticketData
          if (ui.uiAction) assistantMsg.uiAction = ui.uiAction
        } catch { /* skip malformed */ }
      } else {
        // Legacy: reconstruct from tool messages following this assistant turn
        let j = i + 1
        while (j < allMessages.length && allMessages[j].role === "tool") {
          const toolMsg = allMessages[j]
          try {
            const data = JSON.parse(toolMsg.content)
            if (toolMsg.tool_name === "search_products" || toolMsg.tool_name === "get_similar_products") {
              assistantMsg.products = Array.isArray(data) ? data : undefined
            } else if (toolMsg.tool_name === "get_product_details") {
              assistantMsg.products = data ? [data] : undefined
            } else if (toolMsg.tool_name === "list_orders" || toolMsg.tool_name === "get_order_status") {
              assistantMsg.orders = Array.isArray(data) ? data : [data]
            } else if (toolMsg.tool_name === "view_cart" || toolMsg.tool_name === "reorder") {
              assistantMsg.cartData = data?.cart ?? data
            } else if (toolMsg.tool_name === "prepare_checkout") {
              assistantMsg.checkoutData = data
            } else if (toolMsg.tool_name === "get_promotions") {
              assistantMsg.promotions = Array.isArray(data) ? data : undefined
            }
          } catch { /* skip malformed */ }
          j++
        }
        i = j - 1
      }

      reconstructed.push(assistantMsg)
    }
  }

  res.json({ messages: reconstructed })
})

// Create a new session (hero embed uses this on every page load)
router.post("/sessions", (req: Request, res: Response) => {
  const customerId = req.headers["x-customer-id"] as string | undefined
  const { surface } = req.body
  const session = createSession({ customer_id: customerId, surface: surface ?? "floating" })
  res.json({ session })
})

export default router
