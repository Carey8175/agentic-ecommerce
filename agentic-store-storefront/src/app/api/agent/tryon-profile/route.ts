import { NextRequest, NextResponse } from "next/server"
import { resolveCustomer } from "../_resolve-customer"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function POST(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  if (!token || !customerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // Forward the raw multipart form data as-is
  const formData = await req.formData()
  const body = new FormData()
  for (const [key, value] of formData.entries()) {
    body.append(key, value as any)
  }

  const res = await fetch(`${AGENT_URL}/agent/tryon-profile`, {
    method: "POST",
    headers: {
      "x-customer-token": token,
      "x-customer-id": customerId,
    },
    body,
  })

  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  if (!token || !customerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") ?? "self"

  const res = await fetch(`${AGENT_URL}/agent/tryon-profile/${type}`, {
    method: "DELETE",
    headers: {
      "x-customer-token": token,
      "x-customer-id": customerId,
    },
  })

  return NextResponse.json(await res.json(), { status: res.status })
}
