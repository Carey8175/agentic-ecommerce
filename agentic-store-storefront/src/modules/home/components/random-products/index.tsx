import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import RandomProductsClient from "./client"
import ProductPreview from "@modules/products/components/product-preview"

export default async function RandomProducts({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  // Fetch up to 50 products so we have a pool to randomly select from
  const {
    response: { products: allProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 50,
      fields: "*variants.calculated_price",
    },
  })

  if (!allProducts || allProducts.length === 0) {
    return null
  }

  // Randomly select 12 products
  const shuffled = [...allProducts].sort(() => 0.5 - Math.random())
  const selectedProducts = shuffled.slice(0, 12)

  return (
    <RandomProductsClient>
      {selectedProducts.map((product) => (
        <div key={product.id} className="min-w-[250px] max-w-[300px] snap-start flex-none">
          <ProductPreview product={product} region={region} isFeatured />
        </div>
      ))}
    </RandomProductsClient>
  )
}
