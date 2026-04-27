import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  const trackingLinks = (order.fulfillments as any[] || [])
    .flatMap((f) => f.labels || f.tracking_links || [])
    .filter((l) => l && l.tracking_number) || []

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">
        Order #{order.display_id}
      </h1>
      <Text className="text-gray-500 mb-4 text-base">
        Date ordered: <span data-testid="order-date">{new Date(order.created_at).toDateString()}</span>
      </Text>

      {trackingLinks.length > 0 && (
        <Text className="text-gray-500 mb-4 text-base">
          Tracking number{trackingLinks.length > 1 ? "s" : ""}:{" "}
          {trackingLinks.map((link: any, index: number) => (
            <span key={index}>
              {link.tracking_url || link.url ? (
                <a
                  href={link.tracking_url || link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  {link.tracking_number}
                </a>
              ) : (
                <span>{link.tracking_number}</span>
              )}
              {index < trackingLinks.length - 1 && ", "}
            </span>
          ))}
        </Text>
      )}

      <div className="flex items-center text-compact-small gap-x-4 mt-6">
        {showStatus && (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${order.status === "canceled" ? "bg-red-500" : order.fulfillment_status === "fulfilled" ? "bg-emerald-500" : "bg-blue-500"}`} />
              <Text className="text-gray-900 font-medium text-xs">
                Order status:{" "}
                <span className="text-gray-600 font-normal" data-testid="order-status">
                  {formatStatus(order.status === "canceled" ? "canceled" : order.fulfillment_status || order.status || "Pending")}
                </span>
              </Text>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${order.payment_status === "captured" || order.payment_status === "authorized" ? "bg-emerald-500" : "bg-amber-500"}`} />
              <Text className="text-gray-900 font-medium text-xs">
                Payment status:{" "}
                <span
                  className="text-gray-600 font-normal"
                  sata-testid="order-payment-status"
                >
                  {formatStatus(order.payment_status || "Pending")}
                </span>
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
