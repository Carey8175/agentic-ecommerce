import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://127.0.0.1:9001"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json({ orders: [] }, { status: 200 })
  }

  const res = await fetch(`${BACKEND}/store/orders?limit=100&fields=id,display_id,created_at,items.product_id`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "x-publishable-api-key": PUB_KEY,
    },
    next: { revalidate: 300 },
  })

  const data = await res.json()
  return NextResponse.json({ orders: data.orders ?? [] }, { status: res.ok ? 200 : res.status })
}
