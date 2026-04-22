"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import MobileActions from "./mobile-actions"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (variantOptions: HttpTypes.StoreProductVariant["options"]) =>
  variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})

export default function ProductActions({ product, disabled }: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const countryCode = useParams().countryCode as string

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [qty, setQty] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (product.variants?.length === 1) {
      setOptions(optionsAsKeymap(product.variants[0].options) ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() =>
    product.variants?.find((v) => isEqual(optionsAsKeymap(v.options), options)),
    [product.variants, options]
  )

  const isValidVariant = useMemo(() =>
    product.variants?.some((v) => isEqual(optionsAsKeymap(v.options), options)),
    [product.variants, options]
  )

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null
    if (params.get("v_id") === value) return
    if (value) params.set("v_id", value)
    else params.delete("v_id")
    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  const inStock = useMemo(() => {
    if (!selectedVariant) return false
    if (!selectedVariant.manage_inventory) return true
    if (selectedVariant.allow_backorder) return true
    return (selectedVariant.inventory_quantity ?? 0) > 0
  }, [selectedVariant])

  const inventoryQty = selectedVariant?.manage_inventory
    ? selectedVariant.inventory_quantity ?? 0
    : null
  const lowStock = inventoryQty !== null && inventoryQty <= 12 && inventoryQty > 0

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const { cheapestPrice, variantPrice } = getProductPrice({ product, variantId: selectedVariant?.id })
  const selectedPrice = selectedVariant ? variantPrice : cheapestPrice

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    await addToCart({ variantId: selectedVariant.id, quantity: qty, countryCode })
    setIsAdding(false)
  }

  const maxQuantity = selectedVariant?.manage_inventory
    ? (selectedVariant.inventory_quantity ?? 10)
    : 10

  return (
    <>
      <div className="flex flex-col gap-y-5" ref={actionsRef}>

        {/* Price */}
        <div>
          {selectedPrice ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-[30px] font-extrabold text-gray-900" style={{ letterSpacing: "-0.02em" }} data-testid="product-price">
                  {selectedPrice.calculated_price}
                </span>
                {selectedPrice.price_type === "sale" && (
                  <span className="text-base text-gray-400 line-through">{selectedPrice.original_price}</span>
                )}
              </div>
              {selectedPrice.price_type === "sale" && (
                <span className="text-xs font-semibold text-indigo-600">
                  Save {selectedPrice.percentage_diff}%
                </span>
              )}
              <p className="text-xs text-gray-400 mt-1">
                or ${((selectedPrice.calculated_price_number ?? 0) / 6).toFixed(2)}/month with 6 months financing
              </p>
            </>
          ) : (
            <div className="w-32 h-9 bg-gray-100 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Options */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-3">
            {(product.options || []).map((option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.id]}
                updateOption={(id, val) => setOptions((prev) => ({ ...prev, [id]: val }))}
                title={option.title ?? ""}
                data-testid="product-options"
                disabled={!!disabled || isAdding}
              />
            ))}
          </div>
        )}

        {/* Quantity + stock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1 || !!disabled}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors text-lg"
            >
              −
            </button>
            <span className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-gray-900 border-x border-gray-200">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQuantity, q + 1))}
              disabled={qty >= maxQuantity || !!disabled}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors text-lg"
            >
              +
            </button>
          </div>

          {lowStock && (
            <div>
              <p className="text-xs font-semibold text-red-500">Only {inventoryQty} items left!</p>
              <p className="text-[11px] text-gray-400">Don&apos;t miss it</p>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant || !!disabled || isAdding || !isValidVariant}
            className="py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            data-testid="add-product-button"
          >
            {isAdding
              ? "Adding…"
              : !selectedVariant && !options
              ? "Select variant"
              : !inStock || !isValidVariant
              ? "Out of stock"
              : "Add to Cart"}
          </button>
          <button
            type="button"
            disabled={!inStock || !selectedVariant || !!disabled || !isValidVariant}
            className="py-3 rounded-2xl border-2 border-gray-200 text-gray-900 text-sm font-bold hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
          >
            Buy Now
          </button>
        </div>
      </div>

      <MobileActions
        product={product}
        variant={selectedVariant}
        options={options}
        updateOptions={(id, val) => setOptions((prev) => ({ ...prev, [id]: val }))}
        inStock={inStock}
        handleAddToCart={handleAddToCart}
        isAdding={isAdding}
        show={!inView}
        optionsDisabled={!!disabled || isAdding}
      />
    </>
  )
}
