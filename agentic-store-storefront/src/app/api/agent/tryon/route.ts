import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("_medusa_jwt")?.value ?? ""
  const customerId = cookieStore.get("_medusa_customer_id")?.value ?? ""
  const url = new URL(req.url)
  const action = url.searchParams.get("action") ?? "generate"

  const headers: Record<string, string> = {
    "x-customer-token": token,
    "x-customer-id": customerId,
  }

  let upstreamPath = `/agent/tryon/${action}`
  let upstreamBody: BodyInit

  if (action === "upload") {
    // Forward multipart form
    const form = await req.formData()
    upstreamBody = form as any
  } else {
    headers["Content-Type"] = "application/json"
    upstreamBody = await req.text()
  }

  const res = await fetch(`${AGENT_URL}${upstreamPath}`, {
    method: "POST",
    headers,
    body: upstreamBody,
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
