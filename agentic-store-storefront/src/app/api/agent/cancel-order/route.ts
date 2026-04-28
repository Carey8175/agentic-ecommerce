import { NextRequest, NextResponse } from "next/server"
import { resolveCustomer } from "../_resolve-customer"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function POST(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  const { order_id } = JSON.parse(await req.text() || "{}")
  const res = await fetch(`${AGENT_URL}/agent/cancel-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-customer-id": customerId, "x-customer-token": token },
    body: JSON.stringify({ order_id }),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
