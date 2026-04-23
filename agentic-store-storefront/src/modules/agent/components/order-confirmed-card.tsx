"use client"

import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  order: { id: string; display_id: string; total: number; currency_code: string; item_count: number }
}

export default function OrderConfirmedCard({ order }: Props) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3 w-full max-w-xs">
      <div className="flex items-center gap-2">
        <span className="text-emerald-500 text-lg">✅</span>
        <div>
          <p className="text-sm font-bold text-gray-900">Order Placed!</p>
          <p className="text-xs text-gray-500">Order #{order.display_id}</p>
        </div>
      </div>
      <div className="text-xs text-gray-600 space-y-0.5">
        <p>{order.item_count} item{order.item_count !== 1 ? "s" : ""} · {convertToLocale({ amount: order.total, currency_code: order.currency_code })}</p>
        <p className="text-gray-400">You'll receive a confirmation email shortly.</p>
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
