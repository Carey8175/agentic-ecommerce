"use client"

import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { useRef } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function RandomProductsClient({
  children,
}: {
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const containerWidth = scrollRef.current.clientWidth
      scrollRef.current.scrollBy({
        left: direction === "left" ? -containerWidth : containerWidth,
        behavior: "smooth",
      })
    }
  }

  return (
    <li className="content-container py-14 list-none">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">Curated for you</p>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Recommended</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-colors hidden small:flex"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-colors hidden small:flex"
          >
            <ChevronRight />
          </button>
          <LocalizedClientLink
            href="/store"
            className="text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          >
            View all →
          </LocalizedClientLink>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 no-scrollbar scroll-smooth"
      >
        {children}
      </div>
    </li>
  )
}
