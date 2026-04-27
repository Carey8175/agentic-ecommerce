"use client"

import { useState } from "react"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CheckoutCardProps = {
  data: {
    items: { title: string; quantity: number; total: number }[]
    subtotal: number
    shipping_total: number
    discount_total: number
    total: number
    currency_code: string
    shipping_address?: { address_1?: string; city?: string; country_code?: string } | null
    payment_method: string
    one_click_enabled?: boolean
    applied_promos?: string[]
  }
  cartId: string | null
  onSuccess: (order: { id: string; display_id: string; total: number; currency_code: string; item_count: number }) => void
  onDismiss?: () => void
  isLight?: boolean
}

export default function CheckoutCard({ data, cartId, onSuccess, onDismiss, isLight }: CheckoutCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isActiveCart = !!cartId

  const { currency_code } = data
  const freeShipping = !data.shipping_total || data.shipping_total === 0

  const address = data.shipping_address
    ? [data.shipping_address.address_1, data.shipping_address.city, data.shipping_address.country_code?.toUpperCase()]
        .filter(Boolean)
        .join(", ")
    : "No address saved"

  async function placeOrder() {
    if (!isActiveCart) { setError("This cart has already been processed."); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/agent/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Checkout failed")
      fetch("/api/agent/bust-cache", { method: "POST" }).catch(() => {})
      onSuccess(json.order)
    } catch (err: any) {
      setError(err.message)
      // Unlock the chat input so user can continue, but DO NOT dismiss the card itself
      // because we want the user to see the error message and the "Checkout manually" link.
      // We'll dispatch a custom event that agent-panel can listen to.
      window.dispatchEvent(new CustomEvent("agent_checkout_error"))
    } finally {
      setLoading(false)
    }
  }

  const bgClass = isLight ? "bg-white border-gray-200" : "bg-[#11131a] border-white/10"
  const titleClass = isLight ? "text-gray-900" : "text-white/90"
  const itemTitle = isLight ? "text-gray-600" : "text-white/70"
  const itemTotal = isLight ? "text-gray-900" : "text-white/90"
  const borderClass = isLight ? "border-gray-100" : "border-white/10"
  const labelClass = isLight ? "text-gray-500" : "text-white/50"
  const metaClass = isLight ? "text-gray-400" : "text-white/40"
  const btnBg = isLight ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white text-black hover:bg-gray-200"

  return (
    <div className={`border rounded-2xl p-4 shadow-sm space-y-3 w-full max-w-xs ${bgClass}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-bold uppercase tracking-wide ${titleClass}`}>Your Order</p>
        {onDismiss && (
          <button onClick={onDismiss} className={`text-[10px] hover:text-gray-600 transition-colors ${metaClass}`}>
            Dismiss ✕
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {data.items.map((item, i) => (
          <div key={i} className={`flex justify-between text-xs ${itemTitle}`}>
            <span className="truncate max-w-[140px]">{item.title} × {item.quantity}</span>
            <span className={`font-medium ${itemTotal}`}>{convertToLocale({ amount: item.total, currency_code })}</span>
          </div>
        ))}
      </div>
      <div className={`border-t pt-2 space-y-1 ${borderClass}`}>
        {data.applied_promos && data.applied_promos.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <span>🏷️</span>
            <span className="font-mono font-semibold">{data.applied_promos.join(", ")}</span>
            <span>applied</span>
          </div>
        )}
        {!!data.discount_total && (
          <div className="flex justify-between text-xs text-emerald-500">
            <span>Discount</span>
            <span>− {convertToLocale({ amount: data.discount_total, currency_code })}</span>
          </div>
        )}
        <div className={`flex justify-between text-xs ${labelClass}`}>
          <span>Shipping</span>
          <span className={freeShipping ? "text-emerald-500" : ""}>{freeShipping ? "Free" : convertToLocale({ amount: data.shipping_total, currency_code })}</span>
        </div>
        <div className={`flex justify-between text-sm font-bold pt-1 ${titleClass}`}>
          <span>Total</span>
          <span>{convertToLocale({ amount: data.total, currency_code })}</span>
        </div>
      </div>
      <div className={`text-[10px] space-y-0.5 ${metaClass}`}>
        <p>{address}</p>
        <p>{data.payment_method}</p>
      </div>
      {error && (
        <p className="text-[10px] text-red-500">
          {error} ·{" "}
          <LocalizedClientLink href="/checkout?step=address" className="underline">
            Checkout manually →
          </LocalizedClientLink>
        </p>
      )}
      {!isActiveCart ? (
        <p className={`text-xs text-center py-1 ${labelClass}`}>This checkout summary is no longer active.</p>
      ) : data.one_click_enabled === false ? (
        <LocalizedClientLink href="/checkout?step=address" className={`w-full py-2.5 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-2 ${btnBg}`}>
          Go to Checkout →
        </LocalizedClientLink>
      ) : (
        <button
          onClick={placeOrder}
          disabled={loading}
          className={`w-full py-2.5 rounded-full text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${btnBg}`}
        >
          {loading && <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />}
          {loading ? "Placing order..." : "Place Order →"}
        </button>
      )}
    </div>
  )
}
