import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import TryOnPersonalization from "@modules/account/components/tryon-personalization"

export const metadata: Metadata = {
  title: "Try-On & Personalization",
  description: "Manage your AI try-on photos.",
}

export default async function TryOnPage() {
  const customer = await retrieveCustomer()
  if (!customer) notFound()

  return (
    <div className="w-full">
      <TryOnPersonalization customer={customer} />
    </div>
  )
}
