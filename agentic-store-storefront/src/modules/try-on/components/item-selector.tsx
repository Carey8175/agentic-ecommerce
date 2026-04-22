"use client"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"

type Props = {
  items: HttpTypes.StoreCartLineItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ItemSelector({ items, selectedId, onSelect }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`w-[140px] flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            selectedId === item.id ? "border-blue-500 bg-blue-50" : "border-transparent hover:border-gray-200"
          }`}
        >
          <div className="w-full aspect-[3/4] relative overflow-hidden rounded-md bg-gray-100">
            <Thumbnail thumbnail={item.thumbnail} size="full" />
          </div>
          <span className="text-xs text-center truncate w-full font-medium text-gray-800" title={item.title}>{item.title}</span>
        </button>
      ))}
    </div>
  )
}