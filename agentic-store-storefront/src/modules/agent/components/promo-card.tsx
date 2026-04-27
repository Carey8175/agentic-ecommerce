"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Promo = {
  code: string
  type: "percentage" | "fixed"
  value: number
  currency_code: string | null
  target_type: string
  allocation: string
  max_quantity: number | null
  target_categories: { name: string; handle: string }[]
  campaign_name: string | null
  campaign_description: string | null
  ends_at: string | null
  budget_per_customer: number | null
}

type Props = {
  promos: Promo[]
  isLight?: boolean
}

function formatDiscount(p: Promo): string {
  if (p.type === "percentage") return `${p.value}% off`
  const currency = p.currency_code?.toUpperCase() ?? "USD"
  return `${currency} ${(p.value / 100).toFixed(2)} off`
}

function SinglePromoCard({ p, isLight }: { p: Promo, isLight?: boolean }) {
  const [copied, setCopied] = useState(false)

  const bgClass = isLight ? "bg-white border-gray-200" : "bg-white/5 border-white/10"
  const headerBorder = isLight ? "border-gray-200" : "border-white/5"
  const titleClass = isLight ? "text-gray-900" : "text-white/90"
  const descClass = isLight ? "text-gray-500" : "text-white/50"
  const badgeBg = isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/15 text-emerald-400"
  
  const codeBg = isLight ? "bg-indigo-50 border-indigo-100 hover:bg-indigo-100" : "bg-white/5 border-white/10 hover:bg-white/8"
  const codeText = isLight ? "text-indigo-600" : "text-indigo-300"
  const copyHint = isLight ? "text-gray-400 group-hover:text-gray-600" : "text-white/30 group-hover:text-white/60"
  
  const labelClass = isLight ? "text-gray-400" : "text-white/30"
  const valClass = isLight ? "text-gray-700" : "text-white/60"
  const tagBg = isLight ? "bg-gray-100" : "bg-white/5"
  
  const footerBg = isLight ? "bg-gray-50" : "bg-white/5"
  const btnClass = isLight ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"

  function copy() {
    navigator.clipboard.writeText(p.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const viewHref = p.target_categories.length > 0
    ? `/categories/${p.target_categories[0].handle}`
    : "/store"
  const viewLabel = p.target_categories.length > 0
    ? `View ${p.target_categories[0].name}`
    : "View All Items"

  return (
    <div className={`border rounded-xl overflow-hidden flex flex-col w-full ${bgClass}`}>
      {/* Header */}
      <div className={`p-3 flex justify-between items-start border-b ${headerBorder}`}>
        <div>
          <p className={`text-xs font-bold ${titleClass}`}>{p.campaign_name ?? "Promotion"}</p>
          {p.campaign_description && (
            <p className={`text-[10px] mt-0.5 ${descClass}`}>{p.campaign_description}</p>
          )}
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeBg}`}>
          {formatDiscount(p)}
        </span>
      </div>

      {/* Code + details */}
      <div className="p-3 space-y-2">
        {/* Copyable code */}
        <button
          onClick={copy}
          className={`flex items-center gap-2 w-full border rounded-lg px-3 py-2 transition-colors group ${codeBg}`}
        >
          <span className={`font-mono text-xs font-bold tracking-widest flex-1 text-left ${codeText}`}>{p.code}</span>
          <span className={`text-[10px] transition-colors flex-shrink-0 ${copyHint}`}>
            {copied ? "✓ Copied" : "Tap to copy"}
          </span>
        </button>

        {/* Meta */}
        <div className="space-y-1">
          {p.target_categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] w-14 flex-shrink-0 ${labelClass}`}>Applies to</span>
              <div className="flex flex-wrap gap-1">
                {p.target_categories.map(cat => (
                  <span key={cat.handle} className={`text-[10px] px-1.5 py-0.5 rounded ${valClass} ${tagBg}`}>{cat.name}</span>
                ))}
              </div>
            </div>
          )}
          {p.target_categories.length === 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] w-14 flex-shrink-0 ${labelClass}`}>Applies to</span>
              <span className={`text-[10px] ${valClass}`}>All items</span>
            </div>
          )}
          {p.max_quantity && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] w-14 flex-shrink-0 ${labelClass}`}>Max qty</span>
              <span className={`text-[10px] ${valClass}`}>Up to {p.max_quantity} items</span>
            </div>
          )}
          {p.budget_per_customer && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] w-14 flex-shrink-0 ${labelClass}`}>Per customer</span>
              <span className={`text-[10px] ${valClass}`}>{p.budget_per_customer}× use</span>
            </div>
          )}
          {p.ends_at && (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] w-14 flex-shrink-0 ${labelClass}`}>Expires</span>
              <span className={`text-[10px] ${valClass}`}>{new Date(p.ends_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className={`px-3 py-2 flex items-center justify-between mt-auto ${footerBg}`}>
        <p className={`text-[10px] ${labelClass}`}>Use at checkout</p>
        <LocalizedClientLink href={viewHref}>
          <button className={`text-[10px] px-3 py-1.5 rounded-lg transition-colors font-medium ${btnClass}`}>
            {viewLabel}
          </button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default function PromoCard({ promos, isLight }: Props) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {promos.map(p => <SinglePromoCard key={p.code} p={p} isLight={isLight} />)}
    </div>
  )
}
