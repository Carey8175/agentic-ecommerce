"use client"

import { useState, useEffect } from "react"
import TryOnStudio from "./try-on-studio"
import TryOnGallery from "./tryon-gallery"

export default function TryOnPageClient({ cart }: { cart: any | null }) {
  const [jobIds, setJobIds] = useState<string[]>([])
  const [showStudio, setShowStudio] = useState(false)
  const [checked, setChecked] = useState(false)
  const [storageKey, setStorageKey] = useState("_agent_tryon_jobs_guest")

  useEffect(() => {
    // Use JWT token as customer-scoped key — unique per logged-in user, "guest" for anonymous
    const jwt = document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith("_medusa_jwt="))
    const token = jwt ? jwt.split("=")[1]?.slice(0, 16) : null
    const key = token ? `_agent_tryon_jobs_${token}` : "_agent_tryon_jobs_guest"
    setStorageKey(key)
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        if (Array.isArray(parsed) && parsed.length > 0) setJobIds(parsed)
      }
    } catch { /* ignore */ }
    setChecked(true)
  }, [])

  if (!checked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    )
  }

  if (jobIds.length > 0 && !showStudio) {
    return (
      <TryOnGallery
        jobIds={jobIds}
        storageKey={storageKey}
        onSwitchToStudio={() => {
          localStorage.removeItem(storageKey)
          setJobIds([])
          setShowStudio(true)
        }}
      />
    )
  }

  if (!cart || !cart.items?.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-semibold text-gray-900">Nothing to try on yet</h1>
        <p className="text-gray-500 max-w-sm">
          Use the AI assistant to browse products and click <strong>Try On</strong> on any item — no cart needed.
        </p>
      </div>
    )
  }

  return <TryOnStudio cart={cart} />
}
