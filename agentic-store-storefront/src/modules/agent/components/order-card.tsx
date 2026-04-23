import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

export default function OrderCard({ order }: { order: any }) {
  const getStatusIcon = () => {
    if (order.fulfillment_status === "fulfilled") return <span className="text-emerald-400 text-xs">✓</span>
    if (order.fulfillment_status === "shipped") return <span className="text-blue-400 text-xs">🚚</span>
    return <span className="text-amber-400 text-xs">📦</span>
  }

  const getStatusText = () => {
    if (order.fulfillment_status === "fulfilled") return "Fulfilled"
    if (order.fulfillment_status === "shipped") return "Shipped"
    return "Pending"
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col w-full text-left">
      <div className="p-3 flex justify-between items-start border-b border-white/5">
        <div>
          <p className="text-xs font-bold text-white/90">Order #{order.display_id}</p>
          <p className="text-[10px] text-white/50 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full">
          {getStatusIcon()}
          <span className="text-[10px] font-medium text-white/70">{getStatusText()}</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {order.items?.slice(0, 2).map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} className="w-8 h-8 rounded bg-white/10 object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded bg-white/5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/80 line-clamp-1">{item.title}</p>
              <p className="text-[10px] text-white/40">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
        {order.items?.length > 2 && (
          <p className="text-[10px] text-white/40 italic">+{order.items.length - 2} more items</p>
        )}
      </div>

      <div className="px-3 py-2 bg-white/5 flex items-center justify-between mt-auto">
        <p className="text-xs font-semibold text-white/90">
          {convertToLocale({ amount: order.total, currency_code: order.currency_code ?? "usd" })}
        </p>
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <button className="text-[10px] bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
            View Details
          </button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
