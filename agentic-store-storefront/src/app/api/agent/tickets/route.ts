import { NextRequest, NextResponse } from "next/server"
import { resolveCustomer } from "../_resolve-customer"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function GET(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  const res = await fetch(`${AGENT_URL}/agent/tickets`, {
    headers: { "x-customer-id": customerId, "x-customer-token": token },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  const body = await req.json()
  const res = await fetch(`${AGENT_URL}/agent/tickets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-customer-id": customerId, "x-customer-token": token },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
