import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"

const BACKEND = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://127.0.0.1:9001"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("_medusa_jwt")?.value

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = JSON.parse(await req.text() || "{}")

  const res = await fetch(`${BACKEND}/store/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "x-publishable-api-key": PUB_KEY,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (res.ok && body.product_id) {
    revalidateTag(`reviews_${body.product_id}`)
  }
  return NextResponse.json(data, { status: res.status })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const product_id = searchParams.get("product_id")

  if (!product_id) {
    return NextResponse.json({ message: "product_id is required" }, { status: 400 })
  }

  const res = await fetch(
    `${BACKEND}/store/reviews?product_id=${product_id}`,
    {
      headers: { "x-publishable-api-key": PUB_KEY },
      next: { tags: [`reviews_${product_id}`], revalidate: 3600 },
    }
  )

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
