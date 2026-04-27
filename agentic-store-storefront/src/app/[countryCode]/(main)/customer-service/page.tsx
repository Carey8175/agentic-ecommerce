import { Metadata } from "next"
import AgentPanel from "@modules/agent/components/agent-panel"
import SupportTicketsPanel from "@modules/agent/components/support-tickets-panel"
import { retrieveCart } from "@lib/data/cart"

export const metadata: Metadata = {
  title: "Customer Service",
  description: "Get help with your orders, returns, and more.",
}

export default async function CustomerServicePage() {
  const cart = await retrieveCart().catch(() => null)

  return (
    <div className="w-full bg-gray-50/50 min-h-[calc(100vh-4rem)]">
      <div className="content-container py-10 md:py-14 flex flex-col">
        <div className="text-center mb-8 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-medium px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            AI Support
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">Customer Support</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Chat with our AI assistant for quick help, or view your open support requests below.
          </p>
        </div>

        <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto">
          {/* AI Chat */}
          <div className="w-full h-[600px]">
            <AgentPanel mode="support" cartId={cart?.id ?? null} />
          </div>

          {/* Support Tickets */}
          <div className="w-full h-[600px]">
            <SupportTicketsPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
