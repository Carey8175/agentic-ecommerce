"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { addToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"

type ProductCardProps = {
  product: {
    id: string
    handle: string
    title: string
    thumbnail?: string
    variants: { id: string; title: string; price: number | null; currency: string | null; in_stock: boolean }[]
  }
  isLight?: boolean
  onTryOn?: (productId: string, productTitle: string) => void
}

export default function ProductCard({ product, isLight, onTryOn }: ProductCardProps) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const variant = product.variants[0]
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "us"

  async function handleAddToCart() {
    if (!variant?.id) return
    setAdding(true)
    try {
      await addToCart({ variantId: variant.id, quantity: 1, countryCode })
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      console.error("Failed to add to cart", e)
    } finally {
      setAdding(false)
    }
  }

  const bgClass = isLight ? "bg-white border-gray-200 hover:bg-gray-50" : "bg-white/6 border-white/10 hover:bg-white/10"
  const titleClass = isLight ? "text-gray-900 hover:text-indigo-600" : "text-white/90 hover:text-indigo-400"
  const priceClass = isLight ? "text-gray-500" : "text-white/50"
  const emptyPriceClass = isLight ? "text-gray-400" : "text-white/30"
  const tryOnBtnClass = isLight
    ? "text-indigo-600 border-indigo-200 hover:bg-indigo-50"
    : "text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"

  return (
    <div className={`flex gap-3 p-3 border rounded-xl transition-colors w-full ${bgClass}`}>
      {product.thumbnail && (
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0 cursor-pointer" />
        </LocalizedClientLink>
      )}
      <div className="flex-1 min-w-0">
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <p className={`text-xs font-semibold leading-snug cursor-pointer line-clamp-2 ${titleClass}`}>{product.title}</p>
        </LocalizedClientLink>
        {variant?.price != null ? (
          <p className={`text-xs mt-0.5 ${priceClass}`}>
            {convertToLocale({ amount: variant.price, currency_code: variant.currency ?? "usd" })}
          </p>
        ) : (
          <p className={`text-[10px] mt-0.5 italic ${emptyPriceClass}`}>Price unavailable</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0 justify-center">
        <button
          onClick={() => onTryOn?.(product.id, product.title)}
          disabled={!onTryOn}
          className={`text-[10px] font-medium border rounded-full px-2.5 py-1 text-center transition-colors disabled:opacity-30 ${tryOnBtnClass}`}
        >
          Try On
        </button>
        <button
          onClick={handleAddToCart}
          disabled={adding || !variant?.in_stock}
          className="text-[10px] font-semibold text-white bg-indigo-600 rounded-full px-2.5 py-1 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {added ? "✓ Added" : adding ? "..." : !variant?.in_stock ? "Out of stock" : "+ Cart"}
        </button>
      </div>
    </div>
  )
}
