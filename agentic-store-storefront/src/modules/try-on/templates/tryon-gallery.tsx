"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, useRouter } from "next/navigation"

type JobStatus = "pending" | "done" | "error"

interface TryOnJob {
  id: string
  status: JobStatus
  product: { id: string; title?: string; thumbnail?: string; handle?: string; category?: string }
  context_image_used: string
  image_url: string | null
  error: string | null
  created_at: number
}

export function BeforeAfterCompare({ before, after }: { before: string; after: string }) {
  const [split, setSplit] = useState(50)
  const [beforeFailed, setBeforeFailed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setSplit(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)))
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setSplit(Math.min(100, Math.max(0, ((e.touches[0].clientX - rect.left) / rect.width) * 100)))
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", () => (dragging.current = false))
    window.addEventListener("touchmove", onTouchMove)
    window.addEventListener("touchend", () => (dragging.current = false))
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [onMouseMove, onTouchMove])

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-gray-100 cursor-ew-resize select-none"
    >
      {beforeFailed ? (
        <img src={after} className="w-full h-auto block" alt="Try-On Result" />
      ) : (
        <>
          <img src={before} className="w-full h-auto block" alt="Before" onError={() => setBeforeFailed(true)} />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
            <img src={after} className="absolute inset-0 w-full h-full object-cover" alt="Try-On Result" />
          </div>
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/15 pointer-events-none">
            Original
          </div>
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/15 pointer-events-none">
            Try-On
          </div>
        </>
      )}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.2)] z-10 cursor-ew-resize"
        style={{ left: `${split}%`, transform: "translateX(-50%)" }}
        onMouseDown={() => (dragging.current = true)}
        onTouchStart={() => (dragging.current = true)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" /><polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function inferCategory(title?: string): string {
  if (!title) return "Item"
  const t = title.toLowerCase()
  if (/shirt|tee|hoodie|jacket|dress|pants|jeans|coat|sweater|top|blouse|skirt/.test(t)) return "Apparel & Accessories"
  if (/shoes|sneakers|boots|sandals|heels|footwear/.test(t)) return "Footwear"
  if (/sofa|couch|chair|table|desk|shelf|bookcase|bookshelf|bed|cabinet|drawer|wardrobe/.test(t)) return "Furniture"
  if (/lamp|light|rug|curtain|pillow|cushion|mirror|vase|decor/.test(t)) return "Home Decor"
  if (/watch|bag|purse|wallet|belt|hat|cap|scarf|jewelry|ring|necklace|earring/.test(t)) return "Accessories"
  return "Item"
}

function JobCard({ job, onRemove }: { job: TryOnJob; onRemove: () => void }) {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.countryCode as string) || "us"

  const category = job.product?.category || inferCategory(job.product?.title)
  const title = job.product?.title || "Product"
  const thumbnail = job.product?.thumbnail

  const ProductHeader = () => (
    <div className="px-5 py-5 flex flex-col items-center justify-center text-center border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
      <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 mb-1.5">{category}</p>
      <h3 className="text-base font-extrabold text-gray-900 mb-4 leading-snug">{title}</h3>
      {thumbnail ? (
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-400 font-medium">No Image</span>
        </div>
      )}
    </div>
  )

  const RemoveBtn = () => (
    <button
      onClick={onRemove}
      className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 transition-colors"
      aria-label="Remove"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  )

  if (job.status === "pending") {
    return (
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <RemoveBtn />
        <ProductHeader />
        <div className="p-6 flex flex-col items-center justify-center gap-3 bg-white min-h-[180px]">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-gray-500">AI is generating your try-on…</p>
        </div>
      </div>
    )
  }

  if (job.status === "error") {
    return (
      <div className="relative bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
        <RemoveBtn />
        <ProductHeader />
        <div className="p-6 flex flex-col items-center text-center gap-3 bg-red-50/50 min-h-[180px] justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs font-semibold text-red-600">{job.error ?? "Generation failed."}</p>
        </div>
      </div>
    )
  }

  // done — show result preview + two action buttons
  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden gallery-reveal hover:shadow-md transition-shadow flex flex-col">
      <RemoveBtn />
      <ProductHeader />

      {/* Before/after slider preview */}
      {job.image_url && (
        <div className="border-t border-gray-100 px-3 pt-3 pb-1" onClick={e => e.stopPropagation()}>
          {job.context_image_used ? (
            <BeforeAfterCompare before={job.context_image_used} after={job.image_url} />
          ) : (
            <img src={job.image_url} alt="Try-On Result" className="w-full h-auto rounded-2xl" />
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 flex gap-2 border-t border-gray-100 mt-auto">
        <button
          onClick={() => router.push(`/${countryCode}/try-on/${job.id}`)}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          View
        </button>
        {job.product?.handle && (
          <a
            href={`/${countryCode}/products/${job.product.handle}`}
            className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold text-center hover:bg-gray-800 transition-colors"
          >
            + Cart
          </a>
        )}
      </div>
    </div>
  )
}

const POLL_TIMEOUT_MS = 4 * 60_000 // mark stuck after 4 minutes (roughly 4 polls at 60s each)

export default function TryOnGallery({ jobIds, onSwitchToStudio, storageKey = "_agent_tryon_jobs_guest" }: { jobIds: string[]; onSwitchToStudio: () => void; storageKey?: string }) {
  const [jobs, setJobs] = useState<TryOnJob[]>([])
  const pendingSince = useRef<Record<string, number>>({})

  function clearAll() {
    localStorage.removeItem(storageKey)
    onSwitchToStudio()
  }

  function removeJob(id: string) {
    let current: string[] = []
    try { current = JSON.parse(localStorage.getItem(storageKey) ?? "[]") } catch {}
    const remaining = current.filter(j => j !== id)
    if (remaining.length === 0) {
      localStorage.removeItem(storageKey)
      onSwitchToStudio()
    } else {
      localStorage.setItem(storageKey, JSON.stringify(remaining))
      setJobs(prev => prev.filter(j => j.id !== id))
    }
  }

  const fetchAndCheck = useCallback(async () => {
    const results = await Promise.all(
      jobIds.map(id =>
        fetch(`/api/agent/tryon-jobs?id=${id}`)
          .then(r => r.json())
          .catch(() => null)
      )
    )
    const fetched = results.filter(Boolean) as TryOnJob[]

    const now = Date.now()
    const patched = fetched.map(job => {
      if (job.status !== "pending") {
        delete pendingSince.current[job.id]
        return job
      }
      // Record first time we saw this job as pending
      if (!pendingSince.current[job.id]) pendingSince.current[job.id] = now
      // If stuck for >60s, show as error locally (server will also mark it on next restart)
      if (now - pendingSince.current[job.id] > POLL_TIMEOUT_MS) {
        return { ...job, status: "error" as const, error: "Generation timed out. Please try again." }
      }
      return job
    })

    setJobs(patched)
    return patched
  }, [jobIds])

  useEffect(() => {
    if (!jobIds.length) return
    fetchAndCheck()
    const interval = setInterval(async () => {
      const next = await fetchAndCheck()
      if (next.every(j => j.status !== "pending")) clearInterval(interval)
    }, 3000)
    return () => clearInterval(interval)
  }, [jobIds.join(","), fetchAndCheck])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes resultReveal {
          0% { opacity:0; transform: scale(0.97); }
          100% { opacity:1; transform: scale(1); }
        }
        .gallery-reveal { animation: resultReveal 0.45s cubic-bezier(0.5,0,0.5,1) both; }
      `}} />

      <div className="max-w-[1100px] mx-auto px-6 pb-20 pt-8">
        <div className="flex items-center gap-1.5 mb-7 text-xs text-gray-400">
          <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors">Home</LocalizedClientLink>
          <span>/</span>
          <span className="text-gray-900 font-medium">Try-On Results</span>
        </div>

        <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3.5"
              style={{ background: "linear-gradient(135deg,#eef2ff,#f5f3ff)", border: "1px solid #e0e7ff" }}>
              <div className="w-[7px] h-[7px] rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-indigo-500 tracking-widest uppercase">AI Generated</span>
            </div>
            <h1 className="text-[34px] font-extrabold tracking-tight text-gray-900 leading-tight mb-2">
              Your Try-On Gallery
            </h1>
            <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
              {jobs.some(j => j.status === "pending")
                ? "Generating… results will appear automatically."
                : "Drag the slider on any card to compare before and after."}
            </p>
          </div>

          <button
            onClick={clearAll}
            className="py-2.5 px-5 rounded-full border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Clear All
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          </div>
        ) : (() => {
          const valid = jobs.filter(j => j.status === "pending" || j.product?.title)
          const staleCount = jobs.length - valid.length
          return (
            <>
              {staleCount > 0 && (
                <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                  <span>{staleCount} result{staleCount > 1 ? "s" : ""} couldn&apos;t load (created before a recent update).</span>
                  <button onClick={clearAll} className="ml-auto font-semibold underline underline-offset-2 hover:text-amber-900 whitespace-nowrap">Clear all</button>
                </div>
              )}
              {valid.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                  <p className="text-sm">No valid results. Try a new try-on from the AI assistant.</p>
                  <button onClick={clearAll} className="py-2 px-5 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Clear &amp; Start Fresh</button>
                </div>
              ) : (
                <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", alignItems: "start" }}>
                  {valid.map((job, i) => <JobCard key={job.id ?? i} job={job} onRemove={() => removeJob(job.id)} />)}
                </div>
              )}
            </>
          )
        })()
        }
      </div>
    </>
  )
}
