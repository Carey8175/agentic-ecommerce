import { NextRequest, NextResponse } from "next/server"
import { resolveCustomer } from "../../_resolve-customer"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { token, customerId } = await resolveCustomer()
  const res = await fetch(`${AGENT_URL}/agent/tickets/${id}`, {
    headers: { "x-customer-id": customerId, "x-customer-token": token },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { token, customerId } = await resolveCustomer()
  const body = JSON.parse(await req.text() || "{}")
  const res = await fetch(`${AGENT_URL}/agent/tickets/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-customer-id": customerId, "x-customer-token": token },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
