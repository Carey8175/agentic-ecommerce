import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"

type OrderCardProps = {
  order: any
  isLight?: boolean
}

export default function OrderCard({ order, isLight }: OrderCardProps) {
  const bgClass = isLight ? "bg-white border-gray-200" : "bg-white/6 border-white/10"
  const headerBorder = isLight ? "border-gray-200" : "border-white/5"
  const titleClass = isLight ? "text-gray-900" : "text-white/90"
  const dateClass = isLight ? "text-gray-500" : "text-white/50"
  const statusBg = isLight ? "bg-gray-100" : "bg-white/5"
  const statusText = isLight ? "text-gray-600" : "text-white/70"
  const itemBg = isLight ? "bg-gray-100" : "bg-white/10"
  const itemTitle = isLight ? "text-gray-800" : "text-white/80"
  const itemQty = isLight ? "text-gray-500" : "text-white/40"
  const footerBg = isLight ? "bg-gray-50" : "bg-white/5"
  const totalClass = isLight ? "text-gray-900" : "text-white/90"
  const btnClass = isLight ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"

  const getStatusIcon = () => {
    if (order.status === "canceled") return <span className="text-red-500 text-xs">✕</span>
    if (order.fulfillment_status === "delivered") return <span className="text-emerald-500 text-xs">✓</span>
    if (order.fulfillment_status === "fulfilled") return <span className="text-emerald-400 text-xs">✓</span>
    if (order.fulfillment_status === "shipped") return <span className="text-blue-500 text-xs">🚚</span>
    if (order.fulfillment_status === "partially_fulfilled") return <span className="text-blue-400 text-xs">📦</span>
    return <span className="text-amber-500 text-xs">📦</span>
  }

  const getStatusText = () => {
    if (order.status === "canceled") return "Canceled"
    if (order.fulfillment_status === "delivered") return "Delivered"
    if (order.fulfillment_status === "fulfilled") return "Fulfilled"
    if (order.fulfillment_status === "shipped") return "Shipped"
    if (order.fulfillment_status === "partially_fulfilled") return "Partially Fulfilled"
    return "Pending"
  }

  return (
    <div className={`border rounded-xl overflow-hidden flex flex-col w-full text-left ${bgClass}`}>
      <div className={`p-3 flex justify-between items-start border-b ${headerBorder}`}>
        <div>
          <p className={`text-xs font-bold ${titleClass}`}>Order #{order.display_id}</p>
          <p className={`text-[10px] mt-0.5 ${dateClass}`}>{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusBg}`}>
          {getStatusIcon()}
          <span className={`text-[10px] font-medium ${statusText}`}>{getStatusText()}</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {order.items?.slice(0, 2).map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} className={`w-8 h-8 rounded object-cover flex-shrink-0 ${itemBg}`} />
            ) : (
              <div className={`w-8 h-8 rounded flex-shrink-0 ${itemBg}`} />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs line-clamp-1 ${itemTitle}`}>{item.title}</p>
              <p className={`text-[10px] ${itemQty}`}>Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
        {order.items?.length > 2 && (
          <p className={`text-[10px] italic ${itemQty}`}>+{order.items.length - 2} more items</p>
        )}
      </div>

      <div className={`px-3 py-2 flex items-center justify-between mt-auto ${footerBg}`}>
        <p className={`text-xs font-semibold ${totalClass}`}>
          {convertToLocale({ amount: order.total, currency_code: order.currency_code ?? "usd" })}
        </p>
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <button className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors font-medium ${btnClass}`}>
            View Details
          </button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
