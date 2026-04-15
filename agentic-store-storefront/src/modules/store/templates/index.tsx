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
    <div className="w-full bg-white">

      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-gray-100" style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)" }}>
        <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
        <div className="absolute bottom-0 right-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)" }} />
        <div className="content-container relative py-14 md:py-20 flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/70 text-xs font-medium px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            500+ products
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Browse the{" "}
            <span style={{ background: "linear-gradient(90deg, #a78bfa, #6366f1, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              collection
            </span>
          </h1>
          <p className="text-white/50 text-base max-w-md">
            Filter by category, sort by price, or search for exactly what you have in mind.
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex flex-col small:flex-row small:items-start py-10 content-container gap-8"
        data-testid="category-container"
      >
        <RefinementList sortBy={sort} categories={categories} />

        <div className="w-full">
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

    </div>
  )
}

export default StoreTemplate
