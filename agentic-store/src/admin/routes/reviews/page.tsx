import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { useState, useEffect, useCallback } from "react"

export const config = defineRouteConfig({
  label: "Reviews",
  icon: ChatBubbleLeftRight,
})

type Review = {
  id: string
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= rating ? "#f59e0b" : "none"}
          stroke={star <= rating ? "#f59e0b" : "#d1d5db"}
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [productFilter, setProductFilter] = useState("")
  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })
      if (productFilter) params.set("product_id", productFilter)

      const res = await fetch(`/admin/reviews?${params.toString()}`, {
        credentials: "include",
      })
      const data = await res.json()
      setReviews(data.reviews ?? [])
      setCount(data.count ?? 0)
    } finally {
      setLoading(false)
    }
  }, [offset, productFilter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  async function handleDelete(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await fetch(`/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      setReviews((prev) => prev.filter((r) => r.id !== id))
      setCount((c) => c - 1)
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = Math.ceil(count / limit)
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ui-fg-base">Customer Reviews</h1>
          <p className="text-ui-fg-subtle text-sm mt-1">{count} total review{count !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by product ID..."
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setOffset(0) }}
            className="border border-ui-border-base rounded-lg px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive w-64"
          />
          <button
            onClick={fetchReviews}
            className="px-4 py-2 text-sm font-medium text-ui-fg-base bg-ui-bg-base border border-ui-border-base rounded-lg hover:bg-ui-bg-base-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-ui-bg-base border border-ui-border-base rounded-xl overflow-hidden shadow-elevation-card-rest">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
              <th className="text-left text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider px-4 py-3">Rating</th>
              <th className="text-left text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider px-4 py-3">Review</th>
              <th className="text-left text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider px-4 py-3">Product ID</th>
              <th className="text-left text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider px-4 py-3">Customer ID</th>
              <th className="text-left text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-ui-fg-subtle text-sm">
                  Loading reviews...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-ui-fg-subtle text-sm">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map((review, idx) => (
                <tr
                  key={review.id}
                  className={`border-b border-ui-border-base last:border-0 ${idx % 2 === 0 ? "bg-ui-bg-base" : "bg-ui-bg-subtle"}`}
                >
                  <td className="px-4 py-4">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-ui-fg-subtle mt-1 block">{review.rating}/5</span>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    {review.title && (
                      <p className="text-sm font-medium text-ui-fg-base mb-0.5 truncate">{review.title}</p>
                    )}
                    {review.body && (
                      <p className="text-xs text-ui-fg-subtle line-clamp-2">{review.body}</p>
                    )}
                    {!review.title && !review.body && (
                      <span className="text-xs text-ui-fg-muted italic">No text</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-mono text-ui-fg-subtle bg-ui-bg-subtle px-2 py-1 rounded">
                      {review.product_id.slice(0, 20)}…
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-mono text-ui-fg-subtle bg-ui-bg-subtle px-2 py-1 rounded">
                      {review.customer_id.slice(0, 20)}…
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-ui-fg-subtle">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="text-xs font-medium text-ui-fg-error hover:opacity-70 disabled:opacity-40 transition-opacity"
                    >
                      {deletingId === review.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-ui-border-base bg-ui-bg-subtle">
            <p className="text-xs text-ui-fg-subtle">
              Page {currentPage} of {totalPages} · {count} reviews
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1.5 text-xs font-medium border border-ui-border-base rounded-lg text-ui-fg-base bg-ui-bg-base hover:bg-ui-bg-base-hover disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= count}
                className="px-3 py-1.5 text-xs font-medium border border-ui-border-base rounded-lg text-ui-fg-base bg-ui-bg-base hover:bg-ui-bg-base-hover disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
