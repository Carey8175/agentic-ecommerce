"use client"

import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { IconButton } from "@medusajs/ui"
import { useRef } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"

export default function RandomProductsClient({
  children,
}: {
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      // Calculate exactly one full viewport width to scroll by
      const containerWidth = scrollRef.current.clientWidth
      const scrollAmount = direction === "left" ? -containerWidth : containerWidth
      
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <li className="content-container py-12 small:py-24 list-none border-t border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-light tracking-tight text-gray-900">Recommended for You</h2>
        <div className="flex items-center gap-x-4">
          <div className="flex items-center gap-x-2 hidden small:flex">
            <IconButton onClick={() => scroll("left")} variant="transparent">
              <ChevronLeft />
            </IconButton>
            <IconButton onClick={() => scroll("right")} variant="transparent">
              <ChevronRight />
            </IconButton>
          </div>
          <InteractiveLink href="/store">
            <span className="text-xs tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors">View all</span>
          </InteractiveLink>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-x-6 pb-6 no-scrollbar scroll-smooth"
      >
        {children}
      </div>
    </li>
  )
}