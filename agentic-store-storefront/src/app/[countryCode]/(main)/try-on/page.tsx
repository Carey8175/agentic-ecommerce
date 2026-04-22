import { Metadata } from "next"
import { retrieveCart } from "@lib/data/cart"
import TryOnStudio from "@modules/try-on/templates/try-on-studio"

export const metadata: Metadata = {
  title: "Virtual Try-On Studio",
  description: "Try on products virtually using AI.",
}

export default async function TryOnPage() {
  const cart = await retrieveCart()

  if (!cart || !cart.items?.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Your cart is empty</h1>
        <p className="text-gray-500">Add some items to your cart to use the Try-On Studio.</p>
      </div>
    )
  }

  return <TryOnStudio cart={cart} />
}