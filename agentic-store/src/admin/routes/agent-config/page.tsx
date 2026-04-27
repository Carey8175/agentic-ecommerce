import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { useState, useEffect } from "react"

export const config = defineRouteConfig({
  label: "Agent Config",
  icon: ChatBubbleLeftRight,
})

type FAQ = { question: string; answer: string; order: number }
type KnowledgeEntry = { title: string; content: string }

export default function AgentConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState("")

  const [name, setName] = useState("Byteshop Assistant")
  const [tone, setTone] = useState("friendly and helpful")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [oneClickConfirm, setOneClickConfirm] = useState(true)

  useEffect(() => {
    fetch("/admin/agent-config", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setName(data.config.name ?? "Byteshop Assistant")
          setTone(data.config.tone ?? "friendly and helpful")
          setSystemPrompt(data.config.system_prompt ?? "")
          setOneClickConfirm(data.config.one_click_require_confirm ?? true)
        }
        setFaqs(data.faqs ?? [])
        setKnowledge(data.knowledge_base ?? [])
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setDirty(false) })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/admin/agent-config", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { name, tone, system_prompt: systemPrompt, one_click_require_confirm: oneClickConfirm },
          faqs: faqs.map((f, i) => ({ ...f, order: i })),
          knowledge_base: knowledge,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        setSaveError(`Save failed (${res.status}): ${text.slice(0, 200)}`)
      } else {
        setSaved(true)
        setDirty(false)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e: any) {
      setSaveError(e.message ?? "Network error")
    }
    setSaving(false)
  }

  function addFaq() { setFaqs([...faqs, { question: "", answer: "", order: faqs.length }]); setDirty(true) }
  function updateFaq(i: number, field: keyof FAQ, value: string) { setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f))); setDirty(true) }
  function removeFaq(i: number) { setFaqs(faqs.filter((_, idx) => idx !== i)); setDirty(true) }

  function addKnowledge() { setKnowledge([...knowledge, { title: "", content: "" }]); setDirty(true) }
  function updateKnowledge(i: number, field: keyof KnowledgeEntry, value: string) { setKnowledge(knowledge.map((k, idx) => (idx === i ? { ...k, [field]: value } : k))); setDirty(true) }
  function removeKnowledge(i: number) { setKnowledge(knowledge.filter((_, idx) => idx !== i)); setDirty(true) }

  if (loading) return <div className="p-8 text-ui-fg-subtle">Loading...</div>

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ui-fg-base">Agent Configuration</h1>
        <p className="text-sm text-ui-fg-subtle mt-1">Customise how the Byteshop AI Assistant behaves in the storefront.</p>
      </div>

      {/* Personality */}
      <section className="bg-ui-bg-base border border-ui-border-base rounded-xl p-6 space-y-4 shadow-elevation-card-rest">
        <h2 className="text-base font-semibold text-ui-fg-base">Personality & Tone</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle block mb-1">Agent name</label>
            <input
              className="w-full border border-ui-border-base rounded-lg px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive"
              value={name}
              onChange={(e) => { setName(e.target.value); setDirty(true) }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ui-fg-subtle block mb-1">Tone</label>
            <select
              className="w-full border border-ui-border-base rounded-lg px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive"
              value={tone}
              onChange={(e) => { setTone(e.target.value); setDirty(true) }}
            >
              <option value="friendly and helpful">Friendly & Helpful</option>
              <option value="professional and concise">Professional & Concise</option>
              <option value="casual and fun">Casual & Fun</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-ui-fg-subtle block mb-1">Custom system prompt (appended to base prompt)</label>
          <textarea
            className="w-full border border-ui-border-base rounded-lg px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive h-28 resize-none placeholder:text-ui-fg-muted"
            value={systemPrompt}
            onChange={(e) => { setSystemPrompt(e.target.value); setDirty(true) }}
            placeholder="e.g. Always recommend the Black Slim Tee when the user asks for basics."
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ui-fg-base">
          <input type="checkbox" checked={oneClickConfirm} onChange={(e) => { setOneClickConfirm(e.target.checked); setDirty(true) }} className="rounded border-ui-border-base bg-ui-bg-base text-ui-fg-interactive focus:ring-ui-border-interactive" />
          Require confirmation before one-click checkout
        </label>
      </section>

      {/* FAQs */}
      <section className="bg-ui-bg-base border border-ui-border-base rounded-xl p-6 space-y-4 shadow-elevation-card-rest">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ui-fg-base">FAQs</h2>
          <button onClick={addFaq} className="text-xs font-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors">+ Add FAQ</button>
        </div>
        {faqs.length === 0 && <p className="text-sm text-ui-fg-muted">No FAQs yet. Add one above.</p>}
        {faqs.map((faq, i) => (
          <div key={i} className="border border-ui-border-base rounded-lg p-4 space-y-2 relative bg-ui-bg-subtle">
            <button onClick={() => removeFaq(i)} className="absolute top-3 right-3 text-ui-fg-muted hover:text-ui-fg-error text-xs transition-colors">✕</button>
            <input
              className="w-full border border-ui-border-base rounded px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive placeholder:text-ui-fg-muted"
              placeholder="Question"
              value={faq.question}
              onChange={(e) => updateFaq(i, "question", e.target.value)}
            />
            <textarea
              className="w-full border border-ui-border-base rounded px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive h-16 resize-none placeholder:text-ui-fg-muted"
              placeholder="Answer"
              value={faq.answer}
              onChange={(e) => updateFaq(i, "answer", e.target.value)}
            />
          </div>
        ))}
      </section>

      {/* Knowledge Base */}
      <section className="bg-ui-bg-base border border-ui-border-base rounded-xl p-6 space-y-4 shadow-elevation-card-rest">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ui-fg-base">Knowledge Base</h2>
          <button onClick={addKnowledge} className="text-xs font-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors">+ Add Entry</button>
        </div>
        {knowledge.length === 0 && <p className="text-sm text-ui-fg-muted">No entries yet.</p>}
        {knowledge.map((k, i) => (
          <div key={i} className="border border-ui-border-base rounded-lg p-4 space-y-2 relative bg-ui-bg-subtle">
            <button onClick={() => removeKnowledge(i)} className="absolute top-3 right-3 text-ui-fg-muted hover:text-ui-fg-error text-xs transition-colors">✕</button>
            <input
              className="w-full border border-ui-border-base rounded px-3 py-2 text-sm font-medium text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive placeholder:text-ui-fg-muted"
              placeholder="Title (e.g. Return Policy)"
              value={k.title}
              onChange={(e) => updateKnowledge(i, "title", e.target.value)}
            />
            <textarea
              className="w-full border border-ui-border-base rounded px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-base focus:outline-none focus:ring-2 focus:ring-ui-border-interactive h-24 resize-none placeholder:text-ui-fg-muted"
              placeholder="Content..."
              value={k.content}
              onChange={(e) => updateKnowledge(i, "content", e.target.value)}
            />
          </div>
        ))}
      </section>

      {/* Save */}
      <div className="flex items-center justify-end gap-4">
        {saveError && <p className="text-sm text-red-500">{saveError}</p>}
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            saved
              ? "bg-green-600 border border-green-600 text-white"
              : dirty
              ? "bg-ui-bg-interactive border border-ui-border-interactive text-white hover:opacity-90"
              : "bg-ui-bg-base border border-ui-border-base text-ui-fg-muted cursor-not-allowed opacity-50"
          }`}
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
