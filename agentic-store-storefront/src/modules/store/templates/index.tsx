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
      <div
        className="relative overflow-hidden rounded-2xl mx-6 mt-6 mb-10"
        style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)" }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orbs */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent)" }} />
        <div className="absolute -bottom-10 right-20 w-52 h-52 rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14), transparent)" }} />

        <div className="relative z-10 px-10 py-12 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <span className="w-[7px] h-[7px] rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-white/90 tracking-widest uppercase">New Arrivals</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3.5">
            Shop smarter with{" "}
            <br />
            <span style={{ background: "linear-gradient(90deg, #a78bfa, #6366f1, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI assistance
            </span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
            Describe what you&apos;re looking for and let our AI find the perfect match for you.
          </p>
          <div className="flex gap-2.5">
            <a
              href="#products"
              className="px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-colors"
              style={{ background: "#6366f1" }}
            >
              Browse All
            </a>
            <a
              href="/try-on"
              className="px-5 py-2.5 rounded-full text-white/80 text-sm font-medium transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              Try-On Studio ✨
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        id="products"
        className="py-6 content-container"
        data-testid="category-container"
      >
        {/* Search */}
        <SearchBar />

        {/* Filter + Sort bar */}
        <RefinementList sortBy={sort} categories={categories} />

        {/* Section heading */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1.5">PRODUCTS</p>
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
            {categoryId
              ? (categories.find(c => c.id === categoryId)?.name ?? "All Products")
              : q
              ? `Results for "${q}"`
              : "All Products"}
          </h2>
        </div>

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
