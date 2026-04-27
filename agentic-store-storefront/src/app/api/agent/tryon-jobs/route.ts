import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

async function authHeaders() {
  const cookieStore = await cookies()
  return {
    "x-customer-token": cookieStore.get("_medusa_jwt")?.value ?? "",
    "x-customer-id": cookieStore.get("_medusa_customer_id")?.value ?? "",
  }
}

export async function GET(req: NextRequest) {
  const headers = await authHeaders()
  const jobId = req.nextUrl.searchParams.get("id")
  const url = jobId
    ? `${AGENT_URL}/agent/tryon-jobs/${jobId}`
    : `${AGENT_URL}/agent/tryon-jobs`
  const res = await fetch(url, { headers, cache: "no-store" })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const headers = await authHeaders()
  const body = await req.text()
  const res = await fetch(`${AGENT_URL}/agent/tryon-jobs`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body,
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
