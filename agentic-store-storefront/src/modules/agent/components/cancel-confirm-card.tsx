"use client"

import { useState } from "react"

type Props = {
  orderId: string
  displayId: number
  isLight?: boolean
  onConfirmed: (msg: string) => void
  onDismiss: () => void
}

export default function CancelConfirmCard({ orderId, displayId, isLight, onConfirmed, onDismiss }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/agent/cancel-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Cancellation failed")
      // Bust order cache so the orders page reflects the cancellation immediately
      await fetch("/api/agent/bust-cache", { method: "POST" }).catch(() => {})
      onConfirmed(json.message ?? "Your order has been cancelled successfully.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const bgClass = isLight ? "bg-red-50 border-red-200" : "bg-white/5 border-red-500/30"
  const titleClass = isLight ? "text-gray-900" : "text-white"
  const descClass = isLight ? "text-gray-600" : "text-white/60"
  const btnKeep = isLight ? "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200" : "bg-white/10 hover:bg-white/15 text-white/70"

  return (
    <div className={`border rounded-xl p-4 space-y-3 w-full ${bgClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-red-500 text-lg">⚠️</span>
        <p className={`text-sm font-semibold ${titleClass}`}>Cancel Order #{displayId}?</p>
      </div>
      <p className={`text-xs ${descClass}`}>This action cannot be undone. Your order will be cancelled and a refund will be processed within 3–5 business days.</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Yes, Cancel Order"}
        </button>
        <button
          onClick={onDismiss}
          disabled={loading}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${btnKeep}`}
        >
          Keep Order
        </button>
      </div>
    </div>
  )
}
