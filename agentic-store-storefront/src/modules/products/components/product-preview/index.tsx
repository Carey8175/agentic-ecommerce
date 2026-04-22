import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import ProductReviewStars from "../product-review-stars"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })

  return (
    <div data-testid="product-wrapper" className="group flex flex-col gap-0">
      {/* Entire card top is a link */}
      <LocalizedClientLink href={`/products/${product.handle}`} className="flex flex-col gap-2.5">
        {/* Image */}
        <div className="relative overflow-hidden rounded-xl bg-gray-50 aspect-square">
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="full"
              isFeatured={isFeatured}
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-xl" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 px-0.5 mt-1">
          {/* Title */}
          <p
            className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight"
            data-testid="product-title"
          >
            {product.title}
          </p>

          {/* Price */}
          {cheapestPrice && (
            <div className="mt-1">
              <PreviewPrice price={cheapestPrice} />
            </div>
          )}

          {/* Reviews */}
          <div className="mt-0.5">
            <ProductReviewStars productId={product.id} showEmpty={true} />
          </div>

          {/* Description (Amazon style: usually short bullet points, but here we truncate) */}
          {product.description && (
            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mt-1">
              {product.description}
            </p>
          )}
        </div>
      </LocalizedClientLink>

      {/* Add to Cart — outside the <a> so it doesn't trigger navigation */}
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="mt-3 w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 bg-white text-center block"
      >
        Add to Cart
      </LocalizedClientLink>
    </div>
  )
}
