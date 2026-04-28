import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { resolveCustomer } from "../_resolve-customer"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function POST(req: NextRequest) {
  const text = await req.text()
  const body = JSON.parse(text || "{}")
  const cookieStore = await cookies()
  const cartId = cookieStore.get("_medusa_cart_id")?.value ?? ""
  const { token, customerId } = await resolveCustomer()

  // Always prefer the live cart cookie over the client-supplied cart_id
  // (client may hold a stale/completed cart id after checkout)
  if (cartId) body.cart_id = cartId

  let upstream: Response
  try {
    upstream = await fetch(`${AGENT_URL}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-customer-token": token,
        "x-customer-id": customerId,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    console.error("[chat] fetch to agent failed:", e)
    return new Response(JSON.stringify({ error: "Agent service unavailable", detail: String(e) }), { status: 502 })
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    console.error("[chat] agent returned", upstream.status, text)
    return new Response(JSON.stringify({ error: text }), { status: upstream.status })
  }

  const sessionId = upstream.headers.get("x-session-id") ?? ""

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Session-Id": sessionId,
    },
  })
}
