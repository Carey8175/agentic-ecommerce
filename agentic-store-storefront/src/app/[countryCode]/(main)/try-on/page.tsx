import { Metadata } from "next"
import { retrieveCart } from "@lib/data/cart"
import TryOnPageClient from "@modules/try-on/templates/try-on-page-client"

export const metadata: Metadata = {
  title: "Virtual Try-On Studio",
  description: "Try on products virtually using AI.",
}

export default async function TryOnPage() {
  const cart = await retrieveCart()
  return <TryOnPageClient cart={cart ?? null} />
}
