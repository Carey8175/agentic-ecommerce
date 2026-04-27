"use client"

import { useRouter } from "next/navigation"

type Props = {
  ticketId: string
  orderDisplayId?: number
  isLight?: boolean
}

export default function TicketCreatedCard({ ticketId, orderDisplayId, isLight }: Props) {
  const router = useRouter()
  const bgClass = isLight ? "bg-indigo-50 border-indigo-200" : "bg-white/5 border-indigo-500/30"
  const titleClass = isLight ? "text-gray-900" : "text-white"
  const descClass = isLight ? "text-gray-600" : "text-white/60"
  const metaClass = isLight ? "text-gray-400" : "text-white/30"

  function handleViewRequest() {
    // Store ticket ID so the support panel can auto-select it on load
    try { sessionStorage.setItem("_open_ticket_id", ticketId) } catch {}
    router.push("/customer-service")
  }

  return (
    <div className={`border rounded-xl p-4 space-y-3 w-full ${bgClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-indigo-500 text-lg">🎫</span>
        <p className={`text-sm font-semibold ${titleClass}`}>Support Ticket Created</p>
      </div>
      <p className={`text-xs ${descClass}`}>
        {orderDisplayId
          ? `A support ticket has been opened for Order #${orderDisplayId}.`
          : "A support ticket has been opened for your request."}
        {" "}Our team will review it and respond shortly.
      </p>
      <p className={`text-[10px] font-mono ${metaClass}`}>Ticket ID: {ticketId.slice(0, 8)}...</p>
      <button
        onClick={handleViewRequest}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
      >
        View My Requests →
      </button>
    </div>
  )
}
