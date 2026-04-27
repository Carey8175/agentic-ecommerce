"use client"

import { useState, useTransition } from "react"
import useSWR from "swr"
import { HttpTypes } from "@medusajs/types"

type Review = {
  id: string
  rating: number
  title: string | null
  body: string | null
  customer_id: string
  created_at: string
}

type ReviewsData = {
  reviews: Review[]
  count: number
  average_rating: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={s <= rating ? "#f59e0b" : "none"}
            stroke={s <= rating ? "#f59e0b" : "#d1d5db"}
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  )
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              fill={(hover || value) >= s ? "#f59e0b" : "none"}
              stroke={(hover || value) >= s ? "#f59e0b" : "#d1d5db"}
              strokeWidth="1.5"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white">
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-1">
          <StarRow rating={review.rating} />
          {review.title && (
            <p className="text-sm font-semibold text-gray-900">{review.title}</p>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
          {review.created_at.slice(0, 10)}
        </span>
      </div>
      {review.body && (
        <p className="text-sm text-gray-600 leading-relaxed mt-2">{review.body}</p>
      )}
      <p className="text-[11px] text-gray-400 mt-3 font-mono">
        Verified purchase · {(review.customer_id ?? "").slice(0, 12)}…
      </p>
    </div>
  )
}

// ── Write Review Form ─────────────────────────────────────────────────────────

type WriteFormProps = {
  productId: string
  customer: HttpTypes.StoreCustomer | null
  onSubmitted: () => void
}

function WriteReviewForm({ productId, customer, onSubmitted }: WriteFormProps) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [orderId, setOrderId] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch orders lazily only when customer is logged in
  const { data: ordersData } = useSWR<{ orders: HttpTypes.StoreOrder[] }>(
    customer ? "/api/orders" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  )
  const orders = ordersData?.orders ?? []

  // Eligible orders: contain this product
  const eligibleOrders = orders.filter((o) =>
    o.items?.some((i: any) => i.product_id === productId)
  )

  if (!customer) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500 mb-3">Sign in to leave a review</p>
        <a
          href="/account"
          className="inline-block px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          Sign In
        </a>
      </div>
    )
  }

  if (eligibleOrders.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-500">
          You can only review products you've purchased.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-emerald-700">Thank you for your review!</p>
        <p className="text-xs text-emerald-600 mt-1">Your review has been published.</p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (rating === 0) { setError("Please select a star rating."); return }
    // if (!orderId) { setError("Please select an order."); return } // Order ID check commented out to prevent strict failure for single auto-selected orders

    const actualOrderId = orderId || (eligibleOrders.length === 1 ? eligibleOrders[0].id : "")
    if (!actualOrderId) { setError("Please select an order."); return }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            order_id: actualOrderId,
            rating,
            title: title || undefined,
            body: body || undefined,
          }),
        })

        if (!res.ok) {
          const d = await res.json()
          setError(d.message || "Failed to submit review. Please try again.")
          return
        }

        setSuccess(true)
        onSubmitted()
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-100 rounded-xl p-6 bg-white flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-900">Write a Review</h3>

      {/* Star rating */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-2 block">Your Rating *</label>
        <StarInput value={rating} onChange={setRating} />
      </div>

      {/* Order selector */}
      {eligibleOrders.length > 1 && (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Select Order *</label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-indigo-400 transition-colors"
          >
            <option value="">Choose an order…</option>
            {eligibleOrders.map((o) => (
              <option key={o.id} value={o.id}>
                Order #{o.display_id} — {o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Auto-select if only one eligible order */}
      {eligibleOrders.length === 1 && orderId === "" && (
        <input type="hidden" value={eligibleOrders[0].id} ref={(el) => { if (el) setOrderId(eligibleOrders[0].id) }} />
      )}

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Title (optional)</label>
        <input
          type="text"
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your experience"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      {/* Body */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Review (optional)</label>
        <textarea
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts about this product…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-indigo-400 transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

type Props = {
  product: HttpTypes.StoreProduct
  customer: HttpTypes.StoreCustomer | null
}

const INITIAL_SHOW = 3

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProductReviews({ product, customer }: Props) {
  const { data, mutate } = useSWR<ReviewsData>(
    `/api/reviews?product_id=${product.id}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  const [showAll, setShowAll] = useState(false)

  const reviews = data?.reviews ?? []
  const displayed = showAll ? reviews : reviews.slice(0, INITIAL_SHOW)

  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      {/* Section header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1.5">REVIEWS</p>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Customer Reviews
          </h2>
        </div>
        {data && data.count > 0 && (
          <div className="flex items-center gap-3 pb-1">
            <StarRow rating={Math.round(data.average_rating)} size={18} />
            <span className="text-lg font-bold text-gray-900">{data.average_rating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({data.count} review{data.count !== 1 ? "s" : ""})</span>
          </div>
        )}
      </div>

      {/* Review cards */}
      {!data ? (
        <div className="text-sm text-gray-400">Loading reviews…</div>
      ) : data.count === 0 ? (
        <p className="text-sm text-gray-400 mb-8">No reviews yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-4 mb-6">
          {displayed.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
          {data.count > INITIAL_SHOW && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="self-start text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
            >
              See all {data.count} reviews
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Write review form */}
      <div className="mt-8">
        <WriteReviewForm
          productId={product.id}
          customer={customer}
          onSubmitted={() => mutate()}
        />
      </div>
    </div>
  )
}
