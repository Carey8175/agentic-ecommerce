"use client"

import { useState, useTransition, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { applyPromotions } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ExclamationCircleSolid, XMark } from "@medusajs/icons"

function TryOnBanner() {
  return (
    <div
      className="rounded-2xl p-5 flex items-center justify-between relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">New Feature</span>
        </div>
        <p className="text-[14px] font-bold text-white mb-1 leading-snug">Virtual Try-On Studio</p>
        <p className="text-xs text-white/50 leading-relaxed">See how your items look before you buy.</p>
      </div>
      <LocalizedClientLink
        href="/try-on"
        className="relative z-10 px-4 py-2 rounded-full text-white text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ml-4"
        style={{ background: "rgba(99,102,241,0.9)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        Try it on
      </LocalizedClientLink>
    </div>
  )
}

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) return "address"
  if (cart?.shipping_methods?.length === 0) return "delivery"
  return "payment"
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const [code, setCode] = useState("")
  const [isPending, startTransition] = useTransition()
  const [promoError, setPromoError] = useState("")
  const [droppedCode, setDroppedCode] = useState<string | null>(null)

  const { currency_code, item_subtotal, shipping_subtotal, discount_total, tax_total, total, promotions = [] } = cart

  const freeShipping = !shipping_subtotal || shipping_subtotal === 0

  // Find applied manual promotions that have no effect on the cart
  const ineffectivePromotions = useMemo(() => {
    if (!promotions || promotions.length === 0) return []
    
    const effectivePromotionIds = new Set<string>()
    
    cart.items?.forEach(item => {
      item.adjustments?.forEach(adj => {
        if (adj.promotion_id) effectivePromotionIds.add(adj.promotion_id)
      })
    })
    
    cart.shipping_methods?.forEach(sm => {
      sm.adjustments?.forEach(adj => {
        if (adj.promotion_id) effectivePromotionIds.add(adj.promotion_id)
      })
    })
    
    return promotions.filter(p => !p.is_automatic && p.id && !effectivePromotionIds.has(p.id))
  }, [promotions, cart.items, cart.shipping_methods])

  function handleApplyPromo() {
    if (!code.trim()) return
    setPromoError("")
    setDroppedCode(null)
    
    startTransition(async () => {
      try {
        const codes = cart.promotions?.map((p) => p.code ?? "") ?? []
        // Don't apply if it's already in the list to avoid empty/duplicate requests
        if (codes.includes(code.trim())) {
          setCode("")
          return
        }
        const updatedCart = await applyPromotions([...codes, code.trim()])
        
        // Medusa drops the promo code silently if it is invalid for the items in the cart
        const isApplied = updatedCart?.promotions?.some(
          (p: any) => p.code?.toLowerCase() === code.trim().toLowerCase()
        )

        if (!isApplied) {
          setDroppedCode(`"${code.trim().toUpperCase()}" is not applicable to any items in your cart.`)
        }
        
        setCode("")
      } catch (e: any) {
        setPromoError(e?.message ?? "Invalid promo code")
      }
    })
  }

  return (
    <div className="flex flex-col gap-y-5">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">ORDER</p>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Summary</h2>
      </div>

      {/* Line items */}
      <div className="flex flex-col gap-y-2.5">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900" data-testid="cart-subtotal">
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>

        {!!discount_total && (
          <div className="flex items-center justify-between text-sm text-emerald-600">
            <span>Discount</span>
            <span data-testid="cart-discount">
              − {convertToLocale({ amount: discount_total, currency_code })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Shipping</span>
          <span
            className={freeShipping ? "text-emerald-600 font-medium" : "font-medium text-gray-900"}
            data-testid="cart-shipping"
          >
            {freeShipping ? "Free" : convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>

        {!!tax_total && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Taxes</span>
            <span className="font-medium text-gray-900" data-testid="cart-taxes">
              {convertToLocale({ amount: tax_total, currency_code })}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Total</span>
        <span className="text-xl font-bold text-gray-900" data-testid="cart-total">
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>

      {/* Promo code */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 transition-colors bg-white"
          data-testid="discount-input"
        />
        <button
          type="button"
          onClick={handleApplyPromo}
          disabled={isPending || !code.trim()}
          className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          data-testid="discount-apply-button"
        >
          {isPending ? "…" : "Apply"}
        </button>
      </div>
      {promoError && (
        <p className="text-xs text-red-600 -mt-3">{promoError}</p>
      )}
      
      {droppedCode && (
        <div
          className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 -mt-3 text-xs text-orange-800"
          data-testid="discount-dropped-warning"
        >
          <ExclamationCircleSolid className="mt-0.5 shrink-0 text-orange-500" />
          <span className="flex-1">{droppedCode}</span>
          <button
            type="button"
            onClick={() => setDroppedCode(null)}
            className="ml-1 shrink-0 text-orange-500 hover:text-orange-700"
            aria-label="Dismiss"
          >
            <XMark />
          </button>
        </div>
      )}

      {ineffectivePromotions.length > 0 && (
        <div
          className="flex flex-col gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 -mt-3 text-xs text-orange-800"
          data-testid="discount-ineffective-warning"
        >
          {ineffectivePromotions.map((promotion) => (
            <div key={promotion.id} className="flex items-start gap-2">
              <ExclamationCircleSolid className="mt-0.5 shrink-0 text-orange-500" />
              <span className="flex-1">
                "{promotion.code?.toUpperCase()}" is applied, but none of the items in your cart are eligible for this promotion.
              </span>
            </div>
          ))}
        </div>
      )}

      {cart.promotions?.map((p) => p.code).filter(Boolean).length > 0 && (
        <p className="text-xs text-emerald-600 -mt-3">
          Code applied: {cart.promotions.map((p) => p.code).filter(Boolean).join(", ")}
        </p>
      )}

      {/* CTA */}
      <LocalizedClientLink href={"/checkout?step=" + step} data-testid="checkout-button">
        <button
          type="button"
          className="w-full py-3.5 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors"
        >
          Go to Checkout
        </button>
      </LocalizedClientLink>

      {/* SSL note */}
      <p className="text-center text-[11px] text-gray-400">Secure checkout · SSL encrypted</p>

      {/* Try-On banner */}
      <TryOnBanner />
    </div>
  )
}

export default Summary
