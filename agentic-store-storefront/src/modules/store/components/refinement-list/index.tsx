"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { SortOptions } from "./sort-products"

type Category = {
  id: string
  name: string
  handle: string
}

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  "data-testid"?: string
  categories?: Category[]
}

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
]

const RefinementList = ({ sortBy, "data-testid": dataTestId, categories }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.replace(`${pathname}?${query}`, { scroll: false })
  }

  const selectedCategory = searchParams.get("categoryId")

  const handleCategoryClick = (id: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (id === null || params.get("categoryId") === id) {
      params.delete("categoryId")
    } else {
      params.set("categoryId", id)
    }
    params.delete("page")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center justify-between gap-4 mb-8 flex-wrap" data-testid={dataTestId}>
      {/* Category chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* All chip */}
        <button
          onClick={() => handleCategoryClick(null)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
            !selectedCategory
              ? "bg-gray-900 border-gray-900 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          All
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCategoryClick(c.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
              selectedCategory === c.id
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {c.name}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-400">Sort by</span>
        <select
          value={sortBy}
          onChange={(e) => setQueryParams("sortBy", e.target.value)}
          className="text-xs text-gray-700 border border-gray-200 rounded-full px-3 py-1.5 bg-white cursor-pointer outline-none focus:border-indigo-300 transition-colors appearance-none pr-7"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default RefinementList
