"use client"

import { useEffect, useState } from "react"

type Props = {
  productId: string
  showEmpty?: boolean
}

function StarIcon({ filled, half, id }: { filled: boolean; half?: boolean; id: string }) {
  if (half) {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" className="flex-shrink-0">
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill={`url(#${id})`}
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
      </svg>
    )
  }
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" className="flex-shrink-0">
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={filled ? "#f59e0b" : "none"}
        stroke={filled ? "#f59e0b" : "#d1d5db"}
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function ProductReviewStars({ productId, showEmpty = false }: Props) {
  const [data, setData] = useState<{ average_rating: number; count: number } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/reviews?product_id=${productId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setData({ average_rating: d.average_rating ?? 0, count: d.count ?? 0 })
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [productId])

  if (!loaded) return <div className="h-4" />

  if (!data || data.count === 0) {
    if (!showEmpty) return null
    return (
      <span className="text-[10px] text-gray-400">No reviews yet</span>
    )
  }

  const full = Math.floor(data.average_rating)
  const half = data.average_rating % 1 >= 0.5

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= full
          const isHalf = !filled && half && star === full + 1
          return (
            <StarIcon
              key={star}
              filled={filled}
              half={isHalf}
              id={`half-${productId}-${star}`}
            />
          )
        })}
      </div>
      <span className="text-[10px] text-gray-400">({data.count})</span>
    </div>
  )
}
