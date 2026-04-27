"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

type Props = {
  customer: HttpTypes.StoreCustomer
}

type SlotState = {
  url: string
  uploading: boolean
  removing: boolean
  error: string
}

export default function TryOnPersonalization({ customer }: Props) {
  const profile = (customer?.metadata?.tryon_personalization as any) ?? {}
  const savedImages = profile.images ?? {}

  const [self, setSelf] = useState<SlotState>({ url: savedImages.self_url ?? "", uploading: false, removing: false, error: "" })
  const [home, setHome] = useState<SlotState>({ url: savedImages.home_url ?? "", uploading: false, removing: false, error: "" })

  async function upload(type: "self" | "home", file: File) {
    const set = type === "self" ? setSelf : setHome
    set(s => ({ ...s, uploading: true, error: "" }))
    try {
      const form = new FormData()
      form.append("image", file)
      form.append("type", type)
      const res = await fetch("/api/agent/tryon-profile", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Upload failed")
      set(s => ({ ...s, url: data.url }))
    } catch (err: any) {
      set(s => ({ ...s, error: err.message }))
    } finally {
      set(s => ({ ...s, uploading: false }))
    }
  }

  async function remove(type: "self" | "home") {
    const set = type === "self" ? setSelf : setHome
    set(s => ({ ...s, removing: true, error: "" }))
    try {
      const res = await fetch(`/api/agent/tryon-profile?type=${type}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to remove")
      set(s => ({ ...s, url: "" }))
    } catch (err: any) {
      set(s => ({ ...s, error: err.message }))
    } finally {
      set(s => ({ ...s, removing: false }))
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1.5">AI Try-On</p>
        <h2 className="text-xl font-bold text-gray-900">Try-On & Personalization</h2>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          Upload photos so the AI can instantly try on products without requiring you to re-upload each time.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <PhotoSlot label="Your Photo" hint="Full-body or torso photo for apparel try-on." state={self} onFile={f => upload("self", f)} onRemove={() => remove("self")} />
        <PhotoSlot label="Your Space" hint="A photo of your room or outdoor space for furniture/decor try-on." state={home} onFile={f => upload("home", f)} onRemove={() => remove("home")} />
      </div>

      <p className="text-xs text-gray-400 mt-5 leading-relaxed">
        Photos are stored privately and used only for AI try-on generation. They are never shared or used for training.
      </p>
    </div>
  )
}

function PhotoSlot({ label, hint, state, onFile, onRemove }: {
  label: string
  hint: string
  state: SlotState
  onFile: (f: File) => void
  onRemove: () => void
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
          {state.url
            ? <img src={state.url} alt={label} className="w-full h-full object-cover" />
            : <span className="text-3xl text-gray-300">+</span>}
        </div>

        {/* Info + upload */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{hint}</p>
          {state.error && <p className="text-xs text-red-600 mt-2">{state.error}</p>}

          <div className="flex gap-2 mt-3 flex-wrap items-center">
            {/* File input wrapped in a styled span — most reliable cross-browser trigger */}
            <span className={`relative inline-block rounded-full overflow-hidden ${state.uploading ? "opacity-50" : ""}`}>
              <span className="block px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white pointer-events-none select-none">
                {state.uploading ? "Uploading…" : state.url ? "Replace" : "Upload"}
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={state.uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = "" }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </span>

            {state.url && (
              <button type="button" onClick={onRemove} disabled={state.removing}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {state.removing ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0 pt-0.5">
          {state.url
            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Saved</span>
            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Not set</span>}
        </div>
      </div>
    </div>
  )
}
