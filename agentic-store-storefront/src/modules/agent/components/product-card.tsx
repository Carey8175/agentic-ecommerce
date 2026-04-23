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
}

export default function ProductCard({ product }: ProductCardProps) {
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

  return (
    <div className="flex gap-3 p-3 bg-white/6 border border-white/10 rounded-xl hover:bg-white/10 transition-colors w-full">
      {product.thumbnail && (
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0 cursor-pointer" />
        </LocalizedClientLink>
      )}
      <div className="flex-1 min-w-0">
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <p className="text-xs font-semibold text-white/90 leading-snug hover:text-indigo-400 cursor-pointer line-clamp-2">{product.title}</p>
        </LocalizedClientLink>
        {variant?.price != null ? (
          <p className="text-xs text-white/50 mt-0.5">
            {convertToLocale({ amount: variant.price, currency_code: variant.currency ?? "usd" })}
          </p>
        ) : (
          <p className="text-[10px] text-white/30 mt-0.5 italic">Price unavailable</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0 justify-center">
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="text-[10px] font-medium text-white/50 border border-white/15 rounded-full px-2.5 py-1 hover:bg-white/10 text-center"
        >
          View ↗
        </LocalizedClientLink>
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
