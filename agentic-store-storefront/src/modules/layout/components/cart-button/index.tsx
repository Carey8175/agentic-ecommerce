import { unstable_noStore as noStore } from "next/cache"
import { retrieveCart } from "@lib/data/cart"
import CartDropdown from "../cart-dropdown"

export default async function CartButton() {
  noStore()
  const cart = await retrieveCart().catch(() => null)

  return <CartDropdown cart={cart} />
}
