import { HttpTypes } from "@medusajs/types"
import Item from "@modules/cart/components/item"
import repeat from "@lib/util/repeat"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items

  return (
    <div>
      {/* Table header */}
      <div className="hidden small:grid grid-cols-[1fr_120px_100px_100px_40px] gap-4 pb-3 border-b border-gray-100 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Item</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 text-center">Quantity</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 text-right">Unit Price</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 text-right">Total</span>
        <span />
      </div>

      <div className="flex flex-col divide-y divide-gray-100">
        {items
          ? items
              .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
              .map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={cart?.currency_code}
                />
              ))
          : repeat(3).map((i) => <SkeletonLineItem key={i} />)}
      </div>
    </div>
  )
}

export default ItemsTemplate
