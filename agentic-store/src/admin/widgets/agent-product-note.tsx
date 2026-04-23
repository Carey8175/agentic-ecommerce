import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"

type Props = { data: { id: string } }

function AgentProductNoteWidget({ data }: Props) {
  const [note, setNote] = useState("")
  const [recommend, setRecommend] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/admin/agent-config/product-notes?product_id=${data.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.note) {
          setNote(d.note.note ?? "")
          setRecommend(d.note.recommend_enabled ?? true)
        }
      })
  }, [data.id])

  async function handleSave() {
    setSaving(true)
    await fetch("/admin/agent-config/product-notes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: data.id, note, recommend_enabled: recommend }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">🤖 Agent Settings</span>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={recommend}
          onChange={(e) => setRecommend(e.target.checked)}
          className="rounded"
        />
        Recommend this product in agent
      </label>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Agent note (visible to agent only)</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none"
          placeholder='e.g. "Pairs well with cargo shorts. Runs large — suggest sizing down."'
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: ["product.details.side.after"],
})

export default AgentProductNoteWidget
