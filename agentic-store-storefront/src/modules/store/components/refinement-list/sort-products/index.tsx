"use client"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Latest Arrivals" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
]

const SortProducts = ({ "data-testid": dataTestId, sortBy, setQueryParams }: SortProductsProps) => {
  return (
    <div className="flex flex-col gap-1" data-testid={dataTestId}>
      {sortOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setQueryParams("sortBy", opt.value)}
          className={`text-sm text-left px-3 py-2 rounded-lg transition-all ${
            sortBy === opt.value
              ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default SortProducts
