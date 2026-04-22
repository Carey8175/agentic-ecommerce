"use client"

import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const maxQtyFromInventory = item.variant?.inventory_quantity ?? 10
  const maxQuantity = item.variant?.manage_inventory ? maxQtyFromInventory : 10

  if (type === "preview") {
    return (
      <Table.Row className="w-full" data-testid="product-row">
        <Table.Cell className="!pl-0 p-2 w-16">
          <LocalizedClientLink href={`/products/${item.product_handle}`} className="block w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
            <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="square" />
          </LocalizedClientLink>
        </Table.Cell>
        <Table.Cell className="text-left py-2">
          <p className="text-sm font-medium text-gray-900 truncate">{item.product_title}</p>
          <LineItemOptions variant={item.variant} />
        </Table.Cell>
        <Table.Cell className="!pr-0 text-right py-2">
          <span className="text-xs text-gray-400">{item.quantity}x </span>
          <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
        </Table.Cell>
      </Table.Row>
    )
  }

  return (
    <div className="grid grid-cols-[auto_1fr] small:grid-cols-[auto_1fr_120px_100px_100px_40px] gap-4 items-center py-5" data-testid="product-row">
      {/* Thumbnail */}
      <LocalizedClientLink href={`/products/${item.product_handle}`} className="w-16 h-16 small:w-20 small:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 block">
        <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="square" />
      </LocalizedClientLink>

      {/* Title + variant */}
      <div className="min-w-0">
        <LocalizedClientLink href={`/products/${item.product_handle}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors block truncate" data-testid="product-title">
          {item.product_title}
        </LocalizedClientLink>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </div>

      {/* Quantity stepper */}
      <div className="col-span-2 small:col-span-1 flex items-center justify-start small:justify-center gap-0" data-testid="product-quantity-control">
        <button
          type="button"
          onClick={() => changeQuantity(Math.max(1, item.quantity - 1))}
          disabled={updating || item.quantity <= 1}
          className="w-8 h-8 rounded-l-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base"
          data-testid="product-quantity-minus"
        >
          −
        </button>
        <span
          className="w-10 h-8 border-t border-b border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-900"
          data-testid="product-quantity-value"
        >
          {updating ? <Spinner /> : item.quantity}
        </span>
        <button
          type="button"
          onClick={() => changeQuantity(Math.min(maxQuantity, item.quantity + 1))}
          disabled={updating || item.quantity >= maxQuantity}
          className="w-8 h-8 rounded-r-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base"
          data-testid="product-quantity-plus"
        >
          +
        </button>
        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>

      {/* Unit price */}
      <div className="hidden small:flex justify-end text-sm text-gray-500">
        <LineItemUnitPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>

      {/* Line total */}
      <div className="hidden small:flex justify-end text-sm font-bold text-gray-900">
        <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>

      {/* Delete */}
      <div className="hidden small:flex justify-end">
        <DeleteButton id={item.id} data-testid="product-delete-button" />
      </div>
    </div>
  )
}

export default Item
