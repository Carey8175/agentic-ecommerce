"use client"

import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  order: { id: string; display_id: string; total: number; currency_code: string; item_count: number }
  isLight?: boolean
}

export default function OrderConfirmedCard({ order, isLight }: Props) {
  const bgClass = isLight ? "bg-emerald-50 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/30"
  const titleClass = isLight ? "text-emerald-900" : "text-emerald-400"
  const metaClass = isLight ? "text-emerald-700" : "text-emerald-200/70"
  const descClass = isLight ? "text-emerald-800" : "text-emerald-100/90"
  const subClass = isLight ? "text-emerald-600" : "text-emerald-200/50"

  return (
    <div className={`border rounded-2xl p-4 shadow-sm space-y-3 w-full max-w-xs ${bgClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-emerald-500 text-lg">✅</span>
        <div>
          <p className={`text-sm font-bold ${titleClass}`}>Order Placed!</p>
          <p className={`text-xs ${metaClass}`}>Order #{order.display_id}</p>
        </div>
      </div>
      <div className={`text-xs space-y-0.5 ${descClass}`}>
        <p>{order.item_count} item{order.item_count !== 1 ? "s" : ""} · {convertToLocale({ amount: order.total, currency_code: order.currency_code })}</p>
        <p className={subClass}>You'll receive a confirmation email shortly.</p>
      </div>
      <LocalizedClientLink
        href={`/account/orders/details/${order.id}`}
        className="block w-full py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold text-center hover:bg-emerald-700 transition-colors"
      >
        View Order →
      </LocalizedClientLink>
    </div>
  )
}
