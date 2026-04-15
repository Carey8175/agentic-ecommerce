import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

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
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block">
      <div data-testid="product-wrapper" className="flex flex-col gap-3">
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
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-xl" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 px-0.5">
          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors" data-testid="product-title">
            {product.title}
          </p>
          {cheapestPrice && (
            <div className="text-sm text-gray-500">
              <PreviewPrice price={cheapestPrice} />
            </div>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
