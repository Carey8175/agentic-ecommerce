"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BeforeAfterCompare } from "./tryon-gallery"

interface TryOnJob {
  id: string
  status: "pending" | "done" | "error"
  product: { id: string; title?: string; thumbnail?: string; handle?: string; category?: string }
  context_image_used: string
  image_url: string | null
  error: string | null
}

export default function TryOnDetailClient({ jobId, countryCode }: { jobId: string; countryCode: string }) {
  const [job, setJob] = useState<TryOnJob | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/agent/tryon-jobs?id=${jobId}`)
      .then(r => r.json())
      .then(d => { setJob(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [jobId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <p>Try-on result not found.</p>
        <LocalizedClientLink href="/try-on" className="text-indigo-600 text-sm font-semibold hover:underline">← Back to Gallery</LocalizedClientLink>
      </div>
    )
  }

  const title = job.product?.title || "Product"
  const category = job.product?.category || "Item"
  const thumbnail = job.product?.thumbnail

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center gap-1.5 text-xs text-gray-400">
        <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors">Home</LocalizedClientLink>
        <span>/</span>
        <LocalizedClientLink href="/try-on" className="hover:text-gray-900 transition-colors">Try-On Results</LocalizedClientLink>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{title}</span>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* Left — full-size before/after comparison */}
          <div>
            {job.status === "pending" && (
              <div className="flex flex-col items-center justify-center gap-4 py-32 border border-gray-100 rounded-2xl bg-gray-50">
                <div className="w-10 h-10 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">AI is generating your try-on…</p>
              </div>
            )}
            {job.status === "error" && (
              <div className="flex flex-col items-center justify-center gap-3 py-32 border border-red-100 rounded-2xl bg-red-50/40">
                <p className="text-sm font-semibold text-red-600">{job.error ?? "Generation failed."}</p>
              </div>
            )}
            {job.status === "done" && job.image_url && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Drag to compare</p>
                {job.context_image_used ? (
                  <BeforeAfterCompare before={job.context_image_used} after={job.image_url} />
                ) : (
                  <img src={job.image_url} alt="Try-On Result" className="w-full h-auto rounded-2xl border border-gray-100 shadow-sm" />
                )}
              </div>
            )}
          </div>

          {/* Right — product info + actions */}
          <div className="lg:sticky lg:top-8 space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-2">{category}</p>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-snug mb-5">{title}</h1>
              {thumbnail && (
                <div className="w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={thumbnail} alt={title} className="w-full h-auto object-contain max-h-64" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {job.product?.handle && (
                <a
                  href={`/${countryCode}/products/${job.product.handle}`}
                  className="w-full py-4 rounded-2xl bg-gray-900 text-white text-sm font-bold text-center hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Add to Cart
                </a>
              )}
              <button
                onClick={() => router.back()}
                className="w-full py-3.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ← Back to Gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
