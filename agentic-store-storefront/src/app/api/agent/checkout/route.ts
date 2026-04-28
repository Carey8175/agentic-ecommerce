import { NextResponse, NextRequest } from "next/server"
import { cookies } from "next/headers"
import { resolveCustomer } from "../_resolve-customer"
import { revalidateTag } from "next/cache"

const AGENT_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

export async function POST(req: NextRequest) {
  const { token, customerId } = await resolveCustomer()
  const body = JSON.parse(await req.text() || "{}")
  const res = await fetch(`${AGENT_URL}/agent/checkout/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-customer-token": token,
      "x-customer-id": customerId,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()

  // On success, clear the cart cookie so the storefront creates a fresh cart
  if (res.ok && json.order) {
    const cookieStore = await cookies()
    cookieStore.delete("_medusa_cart_id")
    revalidateTag("orders")
    revalidateTag("cart")
  }

  return NextResponse.json(json, { status: res.status })
}
