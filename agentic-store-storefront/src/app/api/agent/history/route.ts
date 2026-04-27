import { NextRequest, NextResponse } from "next/server"
import { resolveCustomer } from "../_resolve-customer"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function GET(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  const url = new URL(req.url)
  const sessionId = url.searchParams.get("session_id")
  const surface = url.searchParams.get("surface")
  const path = sessionId
    ? `/agent/sessions/${sessionId}/messages`
    : surface ? `/agent/sessions?surface=${surface}` : "/agent/sessions"
  const res = await fetch(`${AGENT_URL}${path}`, {
    headers: { "x-customer-id": customerId, "x-customer-token": token },
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  const body = await req.json()
  const res = await fetch(`${AGENT_URL}/agent/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-customer-id": customerId, "x-customer-token": token },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}
