import { getOrSetCart, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  // getOrSetCart heals stale/missing cart IDs, then retrieveCart fetches full items
  await getOrSetCart(countryCode).catch(() => null)
  const cart = await retrieveCart().catch(() => null)

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} />
}
