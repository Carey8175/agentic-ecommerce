import { NextRequest, NextResponse } from "next/server"
import { resolveCustomer } from "../_resolve-customer"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function GET() {
  const { token, customerId } = await resolveCustomer()
  if (!customerId) {
    return NextResponse.json({ settings: { one_click_checkout_enabled: false, saved_address_id: null, history_window: 30 } })
  }
  const res = await fetch(`${AGENT_URL}/agent/settings`, {
    headers: { "x-customer-id": customerId, "x-customer-token": token },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }
  const body = await req.json()
  const res = await fetch(`${AGENT_URL}/agent/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-customer-id": customerId, "x-customer-token": token },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
