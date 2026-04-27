import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export async function GET() {
  revalidateTag("orders")
  revalidateTag("order")
  return NextResponse.json({ ok: true })
}

export async function POST() {
  revalidateTag("orders")
  revalidateTag("order")
  return NextResponse.json({ ok: true })
}
