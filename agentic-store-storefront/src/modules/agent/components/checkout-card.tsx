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
  }
  cartId: string | null
  onSuccess: (order: { id: string; display_id: string; total: number; currency_code: string; item_count: number }) => void
  onDismiss?: () => void
}

export default function CheckoutCard({ data, cartId, onSuccess, onDismiss }: CheckoutCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isActiveCart = cartId === (data as any).id

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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 w-full max-w-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Your Order</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
            Dismiss ✕
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {data.items.map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-600">
            <span className="truncate max-w-[140px]">{item.title} × {item.quantity}</span>
            <span className="font-medium text-gray-900">{convertToLocale({ amount: item.total, currency_code })}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-2 space-y-1">
        {!!data.discount_total && (
          <div className="flex justify-between text-xs text-emerald-600">
            <span>Discount</span>
            <span>− {convertToLocale({ amount: data.discount_total, currency_code })}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-gray-500">
          <span>Shipping</span>
          <span className={freeShipping ? "text-emerald-600" : ""}>{freeShipping ? "Free" : convertToLocale({ amount: data.shipping_total, currency_code })}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
          <span>Total</span>
          <span>{convertToLocale({ amount: data.total, currency_code })}</span>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 space-y-0.5">
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
        <p className="text-xs text-gray-500 text-center py-1">This checkout summary is no longer active.</p>
      ) : (
        <button
          onClick={placeOrder}
          disabled={loading}
          className="w-full py-2.5 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />}
          {loading ? "Placing order..." : "Place Order →"}
        </button>
      )}
    </div>
  )
}
