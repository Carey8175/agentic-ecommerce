"use client"

import { useState, useRef, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Step = 1 | 2 | 3

type CartItem = { id: string; title: string; thumbnail?: string; variant_id: string; product_id: string }

type CategoryInfo = {
  upload_type: string
  upload_prompt: string
  upload_tips: string
  category_label: string
}

type Props = {
  cartId: string | null
  preselectedProductId?: string | null
}

export default function VisualStudioTab({ cartId, preselectedProductId }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<CartItem | null>(null)
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null)
  const [contextImageUrl, setContextImageUrl] = useState<string | null>(null)
  const [contextPreview, setContextPreview] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!cartId) return
    fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"}/store/carts/${cartId}?fields=*items,*items.product,*items.variant`, {
      credentials: "include",
      headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "" },
    })
      .then(r => r.json())
      .then(d => {
        const items = (d.cart?.items ?? []).map((i: any) => ({
          id: i.id,
          title: i.title,
          thumbnail: i.thumbnail,
          variant_id: i.variant_id,
          product_id: i.product?.id,
        }))
        setCartItems(items)
        if (preselectedProductId) {
          const match = items.find((i: CartItem) => i.product_id === preselectedProductId)
          if (match) selectProduct(match)
        }
      })
  }, [cartId, preselectedProductId])

  async function selectProduct(item: CartItem) {
    setSelectedProduct(item)
    setCategoryInfo(null)
    setError("")
    try {
      const res = await fetch("/api/agent/tryon?action=detect-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: item.product_id }),
      })
      const data = await res.json()
      setCategoryInfo(data)
      setStep(2)
    } catch {
      setError("Could not detect product category. Please try again.")
    }
  }

  async function handleUpload(file: File) {
    const form = new FormData()
    form.append("image", file)
    const preview = URL.createObjectURL(file)
    setContextPreview(preview)

    try {
      const res = await fetch("/api/agent/tryon?action=upload", { method: "POST", body: form })
      const data = await res.json()
      setContextImageUrl(data.url)
      setStep(3)
    } catch {
      setError("Upload failed. Please try again.")
    }
  }

  async function handleGenerate() {
    if (!selectedProduct || !contextImageUrl) return
    setGenerating(true)
    setError("")
    setResultUrl(null)
    try {
      const res = await fetch("/api/agent/tryon?action=generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: selectedProduct.product_id, context_image_url: contextImageUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResultUrl(data.image_url)
    } catch (err: any) {
      setError(err.message ?? "Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  function reset() {
    setStep(1)
    setSelectedProduct(null)
    setCategoryInfo(null)
    setContextImageUrl(null)
    setContextPreview(null)
    setResultUrl(null)
    setError("")
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${step >= s ? "bg-indigo-500 text-white" : "bg-white/10 text-white/30"}`}>{s}</div>
            {s < 3 && <div className={`h-px w-8 transition-colors ${step > s ? "bg-indigo-500" : "bg-white/10"}`} />}
          </div>
        ))}
        <span className="text-[10px] text-white/30 ml-1">
          {step === 1 ? "Select item" : step === 2 ? "Upload photo" : "Generate"}
        </span>
      </div>

      {/* Step 1: Select product */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/60">Select an item from your cart</p>
          {cartItems.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm text-white/30">Your cart is empty</p>
              <LocalizedClientLink href="/store" className="text-xs text-indigo-400 hover:text-indigo-300">Browse products →</LocalizedClientLink>
            </div>
          ) : (
            cartItems.map(item => (
              <button key={item.id} onClick={() => selectProduct(item)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left">
                {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                <p className="text-sm text-white/80 font-medium truncate">{item.title}</p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && categoryInfo && (
        <div className="space-y-4">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">{categoryInfo.category_label}</span>
            <p className="text-sm font-semibold text-white/80 mt-1">{categoryInfo.upload_prompt}</p>
            {categoryInfo.upload_tips && <p className="text-[10px] text-white/30 mt-1">{categoryInfo.upload_tips}</p>}
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-500/50 transition-colors"
          >
            <span className="text-3xl">📷</span>
            <p className="text-xs text-white/40 text-center">Click to upload or drag & drop</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
          </div>
          <button onClick={() => setStep(1)} className="text-xs text-white/30 hover:text-white/50">← Back</button>
        </div>
      )}

      {/* Step 3: Generate */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-white/60">Ready to generate</p>
          <div className="flex gap-3">
            {selectedProduct?.thumbnail && (
              <div className="flex-1 space-y-1">
                <p className="text-[9px] text-white/30 uppercase tracking-wide">Product</p>
                <img src={selectedProduct.thumbnail} alt="" className="w-full h-24 object-cover rounded-xl" />
              </div>
            )}
            {contextPreview && (
              <div className="flex-1 space-y-1">
                <p className="text-[9px] text-white/30 uppercase tracking-wide">Your photo</p>
                <img src={contextPreview} alt="" className="w-full h-24 object-cover rounded-xl" />
              </div>
            )}
          </div>

          {resultUrl ? (
            <div className="space-y-3">
              <p className="text-[9px] text-white/30 uppercase tracking-wide">Result</p>
              <img src={resultUrl} alt="Try-on result" className="w-full rounded-xl border border-white/10" />
              <div className="flex gap-2">
                <button onClick={reset} className="flex-1 py-2 rounded-full bg-white/5 text-xs text-white/50 hover:bg-white/10 transition-colors">Try another</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : "Generate"}
              </button>
              <button onClick={() => setStep(2)} className="text-xs text-white/30 hover:text-white/50">← Back</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
