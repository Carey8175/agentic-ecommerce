"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

type CartCardProps = {
  cart: { items: any[]; total: number; currency_code: string }
  onCheckout?: () => void
  isLight?: boolean
}

export default function CartCard({ cart, onCheckout, isLight }: CartCardProps) {
  const bgClass = isLight ? "bg-white border-gray-200" : "bg-white/5 border-white/10"
  const textMain = isLight ? "text-gray-900" : "text-white/90"
  const textSub = isLight ? "text-gray-500" : "text-white/70"
  const textMuted = isLight ? "text-gray-400" : "text-white/40"
  const itemBg = isLight ? "bg-gray-100" : "bg-white/10"
  const borderClass = isLight ? "border-gray-200" : "border-white/5"
  const footerBg = isLight ? "bg-gray-50" : "bg-white/5"
  const editBtn = isLight ? "text-gray-500 hover:text-gray-800" : "text-white/70 hover:text-white"

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className={`border rounded-xl p-4 text-center ${bgClass}`}>
        <p className={`text-sm mb-2 ${textSub}`}>Your cart is empty.</p>
        <LocalizedClientLink href="/store">
          <button className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">
            Continue Shopping
          </button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className={`border rounded-xl overflow-hidden flex flex-col w-full text-left ${bgClass}`}>
      <div className={`p-3 flex justify-between items-center border-b ${borderClass}`}>
        <p className={`text-xs font-bold ${textMain}`}>Cart ({cart.items.length} items)</p>
        <p className={`text-xs font-semibold ${textMain}`}>
          {convertToLocale({ amount: cart.total ?? 0, currency_code: cart.currency_code ?? "usd" })}
        </p>
      </div>

      <div className="p-3 space-y-3">
        {cart.items.slice(0, 3).map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-3">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} className={`w-10 h-10 rounded object-cover flex-shrink-0 ${itemBg}`} />
            ) : (
              <div className={`w-10 h-10 rounded flex-shrink-0 ${itemBg}`} />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs line-clamp-1 ${textMain}`}>{item.title}</p>
              <p className={`text-[10px] mt-0.5 ${textMuted}`}>Qty: {item.quantity}</p>
            </div>
            <div className={`text-xs font-medium ${textSub}`}>
              {convertToLocale({ amount: item.total ?? item.subtotal ?? 0, currency_code: cart.currency_code ?? "usd" })}
            </div>
          </div>
        ))}
        {cart.items.length > 3 && (
          <p className={`text-[10px] italic text-center pt-1 ${textMuted}`}>+{cart.items.length - 3} more items</p>
        )}
      </div>

      <div className={`px-3 py-2 flex items-center justify-between mt-auto ${footerBg}`}>
        <LocalizedClientLink href="/cart">
          <button className={`text-[10px] transition-colors ${editBtn}`}>
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
