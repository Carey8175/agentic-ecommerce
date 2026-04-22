import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({ product, countryCode }: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) queryParams.region_id = region.id
  if (product.collection_id) queryParams.collection_id = [product.collection_id]
  if (product.tags) queryParams.tag_id = product.tags.map((t) => t.id).filter(Boolean) as string[]
  queryParams.is_giftcard = false

  const products = await listProducts({ queryParams, countryCode }).then(({ response }) =>
    response.products.filter((p) => p.id !== product.id)
  )

  if (!products.length) return null

  return (
    <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
      {products.map((p) => (
        <li key={p.id}>
          <Product region={region} product={p} />
        </li>
      ))}
    </ul>
  )
}
