import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import SearchBar from "@modules/store/components/search-bar"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  q,
  categoryId,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  q?: string
  categoryId?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const categories = await listCategories()

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container small:gap-8"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} categories={categories} />
      <div className="w-full">
        <div className="mb-8">
          <h1 data-testid="store-page-title" className="text-3xl font-light tracking-tight text-gray-900">All products</h1>
        </div>
        <SearchBar />
        <Suspense fallback={<SkeletonProductGrid />} key={`${q}-${categoryId}-${pageNumber}-${sort}`}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            q={q}
            categoryId={categoryId}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
