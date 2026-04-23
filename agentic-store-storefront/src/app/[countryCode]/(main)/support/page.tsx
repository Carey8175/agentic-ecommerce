import { Metadata } from "next"
import { retrieveCart } from "@lib/data/cart"
import AgentPanel from "@modules/agent/components/agent-panel"

export const metadata: Metadata = {
  title: "Customer Support | Byteshop",
  description: "Get help with your orders, returns, and more.",
}

export default async function SupportPage() {
  const cart = await retrieveCart()

  return (
    <div className="content-container py-12">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">SUPPORT</p>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">How can we help?</h1>
        <p className="text-sm text-gray-500 mt-2">Ask about your orders, returns, products, or anything else.</p>
      </div>
      <div className="h-[600px] rounded-2xl overflow-hidden shadow-xl border border-gray-100">
        <AgentPanel mode="support" cartId={cart?.id ?? null} />
      </div>
    </div>
  )
}
