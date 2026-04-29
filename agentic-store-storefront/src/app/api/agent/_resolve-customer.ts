import { cookies } from "next/headers"

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""

export async function resolveCustomer(): Promise<{ token: string; customerId: string }> {
  const cookieStore = await cookies()
  const token = cookieStore.get("_medusa_jwt")?.value ?? ""
  if (!token) return { token: "", customerId: "" }

  try {
    const res = await fetch(`${MEDUSA_URL}/store/customers/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      cache: "no-store",
    })
    if (!res.ok) return { token, customerId: "" }
    const { customer } = await res.json()
    return { token, customerId: customer?.id ?? "" }
  } catch {
    return { token, customerId: "" }
  }
}
