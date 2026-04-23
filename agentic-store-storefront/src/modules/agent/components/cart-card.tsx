"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

type CartCardProps = {
  cart: any
  onCheckout?: () => void
}

export default function CartCard({ cart, onCheckout }: CartCardProps) {
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
        <p className="text-sm text-white/70 mb-2">Your cart is empty.</p>
        <LocalizedClientLink href="/store">
          <button className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">
            Continue Shopping
          </button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col w-full text-left">
      <div className="p-3 flex justify-between items-center border-b border-white/5">
        <p className="text-xs font-bold text-white/90">Cart ({cart.items.length} items)</p>
        <p className="text-xs font-semibold text-white/90">
          {convertToLocale({ amount: cart.total ?? 0, currency_code: cart.currency_code ?? "usd" })}
        </p>
      </div>

      <div className="p-3 space-y-3">
        {cart.items.slice(0, 3).map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-3">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} className="w-10 h-10 rounded bg-white/10 object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded bg-white/5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/80 line-clamp-1">{item.title}</p>
              <p className="text-[10px] text-white/40 mt-0.5">Qty: {item.quantity}</p>
            </div>
            <div className="text-xs font-medium text-white/70">
              {convertToLocale({ amount: item.total ?? item.subtotal ?? 0, currency_code: cart.currency_code ?? "usd" })}
            </div>
          </div>
        ))}
        {cart.items.length > 3 && (
          <p className="text-[10px] text-white/40 italic text-center pt-1">+{cart.items.length - 3} more items</p>
        )}
      </div>

      <div className="px-3 py-2 bg-white/5 flex items-center justify-between mt-auto">
        <LocalizedClientLink href="/cart">
          <button className="text-[10px] text-white/70 hover:text-white transition-colors">
            Edit Cart
          </button>
        </LocalizedClientLink>
        {onCheckout ? (
          <button
            onClick={onCheckout}
            className="text-[10px] bg-indigo-500 text-white hover:bg-indigo-600 px-4 py-1.5 rounded-lg transition-colors font-medium"
          >
            Checkout
          </button>
        ) : (
          <LocalizedClientLink href="/checkout?step=address">
            <button className="text-[10px] bg-indigo-500 text-white hover:bg-indigo-600 px-4 py-1.5 rounded-lg transition-colors font-medium">
              Checkout
            </button>
          </LocalizedClientLink>
        )}
      </div>
    </div>
  )
}
