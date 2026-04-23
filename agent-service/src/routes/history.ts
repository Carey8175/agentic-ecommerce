import { Router, Request, Response } from "express"
import { listSessions, getSessionMessages, createSession } from "../db/history"

const router = Router()

// List sessions for a customer (or by surface if no customer)
router.get("/sessions", (req: Request, res: Response) => {
  const customerId = req.headers["x-customer-id"] as string
  if (!customerId) {
    // Return all floating sessions if no customer id (to let guests see their history)
    const sessions = listSessions(null as any, 50)
    res.json({ sessions })
    return
  }
  const sessions = listSessions(customerId, 50)
  res.json({ sessions })
})

// Get all messages for a session (filter out LLM tool calls but include backend UI actions)
router.get("/sessions/:id/messages", (req: Request, res: Response) => {
  const allMessages = getSessionMessages(req.params.id)
  
  // We want to reconstruct the UI state from history.
  // The frontend needs: role, content, products, orders, cartData, checkoutData
  const reconstructed: any[] = []
  
  for (const m of allMessages) {
    if (m.role === "user") {
      reconstructed.push({ id: m.id, role: "user", content: m.content })
    } else if (m.role === "assistant" && m.content) {
      // Create a base assistant message
      const assistantMsg: any = { id: m.id, role: "assistant", content: m.content }
      
      // Look ahead for the tool response that matches this assistant's turn
      // Since tools run right after the assistant, we scan the next few messages
      const toolIdx = allMessages.findIndex(t => t.role === "tool" && t.created_at >= m.created_at && t.created_at <= m.created_at + 10)
      if (toolIdx !== -1) {
        const toolMsg = allMessages[toolIdx]
        try {
          const data = JSON.parse(toolMsg.content)
          if (toolMsg.tool_name === "search_products") {
            assistantMsg.products = Array.isArray(data) ? data : undefined
          } else if (toolMsg.tool_name === "list_orders") {
            assistantMsg.orders = Array.isArray(data) ? data : undefined
          } else if (toolMsg.tool_name === "view_cart") {
            assistantMsg.cartData = data
          } else if (toolMsg.tool_name === "prepare_checkout") {
            assistantMsg.checkoutData = data
          } else if (toolMsg.tool_name === "complete_checkout") {
            assistantMsg.confirmedOrder = data.order
          }
        } catch { /* empty */ }
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
