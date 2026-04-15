import { listCategories } from "@lib/data/categories"
import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  q?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  q,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  q?: string
}) {
  const baseParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    baseParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    baseParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    baseParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    baseParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let products: any[] = []
  let count = 0

  if (q) {
    // Fetch by title/description (q) and by matching category names in parallel
    const allCategories = await listCategories()
    let matchingCategoryIds = allCategories
      .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
      .map((c) => c.id)

    // If a category is explicitly selected, only keep matching categories that are also selected
    if (baseParams.category_id) {
      matchingCategoryIds = matchingCategoryIds.filter(id => baseParams.category_id!.includes(id))
    }

    const [titleResults, categoryResults] = await Promise.all([
      listProductsWithSort({
        page,
        queryParams: { ...baseParams, q },
        sortBy,
        countryCode,
      }),
      matchingCategoryIds.length > 0
        ? listProductsWithSort({
            page,
            queryParams: { ...baseParams, category_id: matchingCategoryIds },
            sortBy,
            countryCode,
          })
        : Promise.resolve({ response: { products: [], count: 0 }, nextPage: null }),
    ])

    // Merge and deduplicate
    const seen = new Set<string>()
    const merged = [...titleResults.response.products, ...categoryResults.response.products].filter(
      (p) => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      }
    )
    products = merged
    count = merged.length
  } else {
    const result = await listProductsWithSort({
      page,
      queryParams: baseParams,
      sortBy,
      countryCode,
    })
    products = result.response.products
    count = result.response.count
  }

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
