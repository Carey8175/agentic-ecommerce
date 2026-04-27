import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

import ProductActions from "@modules/products/components/product-actions"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductActionsWrapper from "./product-actions-wrapper"
import ProductReviews from "@modules/products/components/product-reviews"
import ProductReviewStars from "@modules/products/components/product-review-stars"
import { retrieveCustomer } from "@lib/data/customer"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) return notFound()

  const customer = await retrieveCustomer().catch(() => null)

  return (
    <>
      {/* ── Main product section ─────────────────────────────────── */}
      <div className="content-container py-8" data-testid="product-container">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-6 text-xs text-gray-400">
          <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors">Home</LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink href="/store" className="hover:text-gray-900 transition-colors">Shop</LocalizedClientLink>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{product.title}</span>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 small:grid-cols-[1fr_420px] gap-10 xl:gap-16">

          {/* ── Left: image gallery ── */}
          <GallerySection images={images} />

          {/* ── Right: product info + actions ── */}
          <div className="flex flex-col gap-y-6">
            {/* Collection label */}
            {product.collection && (
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {product.collection.title}
              </LocalizedClientLink>
            )}

            {/* Title */}
            <div>
              <h1
                className="text-[34px] font-extrabold text-gray-900 leading-[1.15] mb-2"
                style={{ letterSpacing: "-0.025em" }}
                data-testid="product-title"
              >
                {product.title}
              </h1>
              {product.description && (
                <p className="text-sm text-gray-500 leading-[1.7]">{product.description}</p>
              )}
            </div>

            {/* Stars */}
            <ProductReviewStars productId={product.id} />

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* Actions (price, options, add to cart) */}
            <Suspense
              fallback={
                <ProductActions disabled={true} product={product} region={region} />
              }
            >
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>

            {/* Perks */}
            <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Free Delivery</p>
                  <p className="text-xs text-gray-400">Enter your postal code for availability</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Return Delivery</p>
                  <p className="text-xs text-gray-400">Free 30-day returns. Details apply.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews ──────────────────────────────────────────────── */}
      <div className="content-container mb-20">
        <ProductReviews
          product={product}
          customer={customer}
        />
      </div>

      {/* ── Related products ─────────────────────────────────────── */}
      <div className="content-container mt-4 mb-20" data-testid="related-products-container">
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1.5">CURATED FOR YOU</p>
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight" style={{ letterSpacing: "-0.02em" }}>Similar Items You Might Like</h2>
        </div>
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

/* ── Image gallery with main image + thumbnail strip ── */
function GallerySection({ images }: { images: HttpTypes.StoreProductImage[] }) {
  if (!images || images.length === 0) return null

  const main = images[0]
  const thumbs = images.slice(0, 8)

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-50">
        {main.url && (
          <Image
            src={main.url}
            alt="Product image"
            fill
            priority
            sizes="(max-width:1024px) 100vw, 55vw"
            style={{ objectFit: "contain" }}
            className="p-6"
          />
        )}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/40 text-white text-[11px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            1 / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {thumbs.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {thumbs.map((img, idx) => (
            <div
              key={img.id}
              className={`relative aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 transition-colors ${
                idx === 0 ? "border-indigo-400" : "border-transparent hover:border-gray-300"
              }`}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  sizes="120px"
                  style={{ objectFit: "contain" }}
                  className="p-2"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductTemplate
