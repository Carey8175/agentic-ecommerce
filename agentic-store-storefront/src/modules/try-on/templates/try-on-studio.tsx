"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

// ── Step Badge ─────────────────────────────────────────────────────────────────
function StepBadge({ n, status }: { n: number; status: "active" | "done" | "idle" }) {
  const base = "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
  if (status === "done") return <div className={`${base} bg-emerald-500 text-white`}>✓</div>
  if (status === "active") return <div className={`${base} bg-indigo-500 text-white`}>{n}</div>
  return <div className={`${base} bg-gray-100 text-gray-400`}>{n}</div>
}

// ── Scan Overlay (AI generating animation) ────────────────────────────────────
function ScanOverlay() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden z-10 pointer-events-none">
      <div className="absolute inset-0 bg-indigo-500/10" />
      <div
        className="absolute left-0 right-0 h-[3px]"
        style={{
          background: "linear-gradient(90deg, transparent, #6366f1, #a78bfa, transparent)",
          animation: "scanLine 1.8s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 flex items-center justify-center">
          <div
            className="w-5 h-5 rounded-full border-[2.5px] border-indigo-200/40 border-t-indigo-500"
            style={{ animation: "spin 0.7s linear infinite" }}
          />
        </div>
        <div className="bg-black/65 backdrop-blur-md rounded-full px-4 py-1.5">
          <span className="text-xs font-semibold text-white">AI generating…</span>
        </div>
      </div>
    </div>
  )
}

// ── Before/After Compare Slider ────────────────────────────────────────────────
function BeforeAfterCompare({ before, after }: { before: string; after: string }) {
  const [split, setSplit] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    setSplit(pct)
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((e.touches[0].clientX - rect.left) / rect.width) * 100))
    setSplit(pct)
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
      style={{ aspectRatio: "4/3" }}
    >
      {/* Before */}
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <img src={before} className="w-full h-full object-cover" alt="Before" />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/15">
          Before
        </div>
      </div>
      {/* After — clipped */}
      <div
        className="absolute inset-0 bg-indigo-50 flex items-center justify-center"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      >
        <img src={after} className="w-full h-full object-cover" alt="After" style={{ filter: "hue-rotate(30deg) saturate(1.2)" }} />
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/15">
          After
        </div>
      </div>
      {/* Handle */}
      <div
        className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.2)] z-10 cursor-ew-resize"
        style={{ left: `${split}%`, transform: "translateX(-50%)" }}
        onMouseDown={() => (dragging.current = true)}
        onTouchStart={() => (dragging.current = true)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" transform="translate(0,0)" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Category prompt ────────────────────────────────────────────────────────────
function getCategoryPrompt(item: any): string {
  const title = (item?.product_title || item?.title || "").toLowerCase()
  if (title.includes("shirt") || title.includes("pant") || title.includes("jacket") || title.includes("dress"))
    return "Upload a full-body or torso photo for apparel try-on."
  if (title.includes("table") || title.includes("chair") || title.includes("shelf") || title.includes("desk") || title.includes("sofa"))
    return "Upload a photo of your room to see this furniture."
  if (title.includes("headphone") || title.includes("earbud") || title.includes("speaker"))
    return "Upload a photo of your setup or desk environment to preview this audio device."
  return "Upload a base image to preview this item in your environment."
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TryOnStudio({ cart }: { cart: HttpTypes.StoreCart }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploadedImg, setUploadedImg] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImg, setResultImg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const items = cart.items || []
  const selectedItem = items.find(i => i.id === selectedId)

  function selectItem(id: string) {
    setSelectedId(id)
    setResultImg(null)
  }

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedImg(reader.result as string)
      setResultImg(null)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  function clearUpload() {
    setUploadedImg(null)
    setResultImg(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function generate() {
    if (!selectedId || !uploadedImg) return
    setIsGenerating(true)
    setResultImg(null)
    try {
      const res = await fetch("/api/agent/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: selectedItem?.product_id, user_image_base64: uploadedImg }),
      })
      const data = await res.json()
      setResultImg(data.image_url || uploadedImg)
    } catch {
      // Simulate result with uploaded image for demo
      await new Promise(r => setTimeout(r, 2800))
      setResultImg(uploadedImg)
    } finally {
      setIsGenerating(false)
    }
  }

  const stepStatus = (n: number): "active" | "done" | "idle" => {
    if (n === 1) return selectedId ? "done" : "active"
    if (n === 2) return uploadedImg ? "done" : selectedId ? "active" : "idle"
    if (n === 3) return resultImg ? "done" : uploadedImg && selectedId ? "active" : "idle"
    return "idle"
  }

  const canGenerate = !!selectedId && !!uploadedImg && !isGenerating

  return (
    <>
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(0); opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { transform: translateY(400px); opacity: 0.8; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }
        @keyframes resultReveal {
          0% { opacity:0; transform: scale(0.96); }
          100% { opacity:1; transform: scale(1); }
        }
        .result-reveal { animation: resultReveal 0.5s cubic-bezier(0.5,0,0.5,1) both; }
        .generate-btn { animation: glowPulse 2s infinite; }
        .generate-btn:hover { transform: translateY(-2px); }
        .generate-btn:disabled { animation: none; opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-6 pb-20 pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-7 text-xs text-gray-400">
          <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors">Home</LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink href="/cart" className="hover:text-gray-900 transition-colors">Cart</LocalizedClientLink>
          <span>/</span>
          <span className="text-gray-900 font-medium">Virtual Try-On</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3.5"
            style={{ background: "linear-gradient(135deg,#eef2ff,#f5f3ff)", border: "1px solid #e0e7ff" }}>
            <div className="w-[7px] h-[7px] rounded-full bg-emerald-500" style={{ animation: "pulse 2s infinite" }} />
            <span className="text-[11px] font-semibold text-indigo-500 tracking-widest uppercase">AI-Powered</span>
          </div>
          <h1 className="text-[38px] font-extrabold tracking-tight text-gray-900 leading-tight mb-2.5">
            Virtual Try-On Studio
          </h1>
          <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
            Select an item from your cart, upload a photo, and let AI show you how it looks — before you commit.
          </p>
        </div>

        <div className="grid gap-8" style={{ gridTemplateColumns: "1fr 420px" }}>
          {/* ── Left: Steps ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Step 1 — Item Selection */}
            <div className={`bg-white rounded-2xl p-7 border transition-all ${
              stepStatus(1) === "active" ? "border-indigo-200 shadow-[0_0_0_3px_rgba(99,102,241,0.06)]"
              : stepStatus(1) === "done" ? "border-emerald-200"
              : "border-gray-100"
            }`}>
              <div className="flex items-center gap-3 mb-5">
                <StepBadge n={1} status={stepStatus(1)} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Step 1</p>
                  <h2 className="text-base font-bold text-gray-900">Select an item from your cart</h2>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item.id)}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-[1.5px] w-[120px] cursor-pointer transition-all ${
                      selectedId === item.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-indigo-300 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden ${
                      selectedId === item.id ? "bg-indigo-100" : "bg-gray-100"
                    }`}>
                      <Thumbnail thumbnail={item.thumbnail} images={item.variant?.product?.images} size="square" />
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight line-clamp-2 ${
                      selectedId === item.id ? "text-indigo-700" : "text-gray-700"
                    }`}>
                      {item.product_title || item.title}
                    </span>
                    {item.variant?.title && (
                      <span className="text-[10px] text-gray-400">{item.variant.title}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Upload */}
            <div className={`bg-white rounded-2xl p-7 border transition-all ${
              !selectedId ? "opacity-50 pointer-events-none" : ""
            } ${
              stepStatus(2) === "active" ? "border-indigo-200 shadow-[0_0_0_3px_rgba(99,102,241,0.06)]"
              : stepStatus(2) === "done" ? "border-emerald-200"
              : "border-gray-100"
            }`}>
              <div className="flex items-center gap-3 mb-5">
                <StepBadge n={2} status={stepStatus(2)} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Step 2</p>
                  <h2 className="text-base font-bold text-gray-900">Upload a photo</h2>
                </div>
              </div>

              {selectedItem && (
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{getCategoryPrompt(selectedItem)}</p>
              )}

              {!uploadedImg ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3.5 cursor-pointer text-center transition-all ${
                    isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                  }`}
                >
                  <div className="w-13 h-13 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Drop your photo here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse · PNG, JPG up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img src={uploadedImg} alt="Uploaded" className="w-full rounded-xl object-cover" style={{ aspectRatio: "4/3" }} />
                  <button
                    onClick={clearUpload}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/55 border-none text-white text-sm cursor-pointer flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-[11px] text-white font-medium">
                    Photo uploaded
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
            </div>

            {/* Step 3 — Generate */}
            <div className={`bg-white rounded-2xl p-7 border transition-all ${
              !(selectedId && uploadedImg) ? "opacity-50 pointer-events-none" : ""
            } ${
              stepStatus(3) === "active" ? "border-indigo-200 shadow-[0_0_0_3px_rgba(99,102,241,0.06)]"
              : stepStatus(3) === "done" ? "border-emerald-200"
              : "border-gray-100"
            }`}>
              <div className="flex items-center gap-3 mb-5">
                <StepBadge n={3} status={stepStatus(3)} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Step 3</p>
                  <h2 className="text-base font-bold text-gray-900">Generate your try-on</h2>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Our AI will overlay the selected item onto your photo to show how it fits your setup.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={generate}
                  disabled={!canGenerate}
                  className="generate-btn px-12 py-[15px] rounded-full text-white text-[15px] font-bold border-none cursor-pointer transition-all"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full border-[2.5px] border-white/30 border-t-white inline-block" style={{ animation: "spin 0.7s linear infinite" }} />
                      Generating…
                    </span>
                  ) : (
                    "Generate Try-On"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Preview Panel ────────────────────────────────────────── */}
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Panel header */}
              <div
                className="px-6 py-[18px] flex items-center justify-between relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)" }}
              >
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
                  backgroundSize: "28px 28px"
                }} />
                <div className="relative z-10">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-300/80 mb-0.5">Preview</p>
                  <p className="text-[15px] font-bold text-white">Try-On Result</p>
                </div>
                {selectedItem && (
                  <div className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15">
                    <div className="w-5 h-5 rounded overflow-hidden bg-white/20 flex-shrink-0">
                      <Thumbnail thumbnail={selectedItem.thumbnail} size="square" />
                    </div>
                    <span className="text-[11px] font-medium text-white/80 max-w-[100px] truncate">
                      {selectedItem.product_title || selectedItem.title}
                    </span>
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div className="p-5">
                {!resultImg && !isGenerating ? (
                  <div
                    className="rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                    <p className="text-sm font-medium text-center leading-relaxed">Your AI try-on<br />result will appear here</p>
                  </div>
                ) : isGenerating ? (
                  <div className="relative rounded-xl bg-gray-100 overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    {uploadedImg && <img src={uploadedImg} className="w-full h-full object-cover opacity-40" alt="" />}
                    <ScanOverlay />
                  </div>
                ) : (
                  <div className="result-reveal">
                    <BeforeAfterCompare before={uploadedImg!} after={resultImg!} />
                    <p className="text-[11px] text-gray-400 text-center mt-2.5">Drag the handle to compare before and after</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {resultImg && (
                <div className="px-5 pb-5 flex gap-2.5">
                  <button
                    onClick={generate}
                    className="flex-1 py-2.5 rounded-full border-[1.5px] border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300"
                  >
                    Regenerate
                  </button>
                  <LocalizedClientLink
                    href="/cart"
                    className="flex-1 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold text-center transition-colors hover:bg-gray-800"
                  >
                    Back to Cart
                  </LocalizedClientLink>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-4 p-5 bg-white border border-gray-100 rounded-xl">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Tips for best results</p>
              {["Use a well-lit, clear photo", "Avoid heavy background clutter", "Front-facing photos work best"].map((tip, i) => (
                <div key={i} className="flex gap-2 items-start mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs text-gray-500 leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
