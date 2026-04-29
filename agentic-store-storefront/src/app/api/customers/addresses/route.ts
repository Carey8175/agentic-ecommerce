import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("_medusa_jwt")?.value ?? ""

  const res = await fetch(`${MEDUSA_URL}/store/customers/me/addresses`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-publishable-api-key": PUBLISHABLE_KEY,
    },
  })

  if (!res.ok) {
    return NextResponse.json({ addresses: [] }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
