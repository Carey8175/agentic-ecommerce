import { Router, Request, Response } from "express"
import { runChatAgent } from "../agents/chat-agent"
import { createSession, getSession } from "../db/history"
import { v4 as uuidv4 } from "uuid"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  const { message, session_id, cart_id } = req.body
  const customerToken: string = (req.headers["x-customer-token"] as string) ?? ""
  const customerId: string | null = (req.headers["x-customer-id"] as string) ?? null

  if (!message) {
    res.status(400).json({ error: "message is required" })
    return
  }

  // Resolve or create session
  let sid = session_id
  if (!sid || !getSession(sid)) {
    const session = createSession({
      customer_id: customerId ?? undefined,
      surface: req.body.surface ?? "floating",
    })
    sid = session.id
    // Send session_id back immediately before SSE starts
    res.setHeader("X-Session-Id", sid)
  }

  await runChatAgent({
    session_id: sid,
    customer_id: customerId,
    cart_id: cart_id ?? null,
    customer_token: customerToken,
    user_message: message,
    res,
  })
})

export default router
