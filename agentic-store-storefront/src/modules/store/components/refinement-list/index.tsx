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
  'data-testid'?: string
  categories?: Category[]
}

const RefinementList = ({ sortBy, 'data-testid': dataTestId, categories }: RefinementListProps) => {
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
    router.push(`${pathname}?${query}`)
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
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex small:flex-col gap-12 py-4 mb-8 small:min-w-[250px]">
      <div className="bg-gray-50 rounded-2xl p-6 flex flex-col gap-6 w-full shadow-sm border border-gray-100">
        <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
        {categories && categories.length > 0 && (
          <div className="flex flex-col gap-y-3">
            <span className="text-xs tracking-widest uppercase text-gray-400 font-medium">Categories</span>
            <ul className="flex flex-col gap-y-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handleCategoryClick(c.id)}
                    className={`text-sm text-left w-full transition-colors py-0.5 ${
                      selectedCategory === c.id
                        ? "border-l-2 border-gray-900 pl-2 text-gray-900 font-medium"
                        : "pl-2 text-gray-500 hover:text-gray-900"
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
