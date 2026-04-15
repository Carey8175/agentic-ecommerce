"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import SortProducts, { SortOptions } from "./sort-products"

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

  const handleCategoryClick = (id: string) => {
    const params = new URLSearchParams(searchParams)
    if (params.get("categoryId") === id) {
      params.delete("categoryId")
    } else {
      params.set("categoryId", id)
    }
    params.delete("page")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex small:flex-col gap-4 mb-8 small:min-w-[220px]">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-6 w-full shadow-sm">

        {/* Sort */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Sort by</span>
          <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
        </div>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Categories</span>
            <ul className="flex flex-col gap-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleCategoryClick(c.id)}
                    className={`text-sm text-left w-full px-3 py-2 rounded-lg transition-all ${
                      selectedCategory === c.id
                        ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default RefinementList
