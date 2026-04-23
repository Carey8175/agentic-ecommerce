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
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch("/admin/agent-config", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: { name, tone, system_prompt: systemPrompt, one_click_require_confirm: oneClickConfirm },
        faqs: faqs.map((f, i) => ({ ...f, order: i })),
        knowledge_base: knowledge,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "", order: faqs.length }])
  }

  function updateFaq(i: number, field: keyof FAQ, value: string) {
    setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)))
  }

  function removeFaq(i: number) {
    setFaqs(faqs.filter((_, idx) => idx !== i))
  }

  function addKnowledge() {
    setKnowledge([...knowledge, { title: "", content: "" }])
  }

  function updateKnowledge(i: number, field: keyof KnowledgeEntry, value: string) {
    setKnowledge(knowledge.map((k, idx) => (idx === i ? { ...k, [field]: value } : k)))
  }

  function removeKnowledge(i: number) {
    setKnowledge(knowledge.filter((_, idx) => idx !== i))
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Customise how the Byteshop AI Assistant behaves in the storefront.</p>
      </div>

      {/* Personality */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Personality & Tone</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Agent name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Tone</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="friendly and helpful">Friendly & Helpful</option>
              <option value="professional and concise">Professional & Concise</option>
              <option value="casual and fun">Casual & Fun</option>
              <option value="formal">Formal</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Custom system prompt (appended to base prompt)</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-28 resize-none"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="e.g. Always recommend the Black Slim Tee when the user asks for basics."
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={oneClickConfirm} onChange={(e) => setOneClickConfirm(e.target.checked)} />
          Require confirmation before one-click checkout
        </label>
      </section>

      {/* FAQs */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">FAQs</h2>
          <button onClick={addFaq} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Add FAQ</button>
        </div>
        {faqs.length === 0 && <p className="text-sm text-gray-400">No FAQs yet. Add one above.</p>}
        {faqs.map((faq, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-2 relative">
            <button onClick={() => removeFaq(i)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 text-xs">✕</button>
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              placeholder="Question"
              value={faq.question}
              onChange={(e) => updateFaq(i, "question", e.target.value)}
            />
            <textarea
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm h-16 resize-none"
              placeholder="Answer"
              value={faq.answer}
              onChange={(e) => updateFaq(i, "answer", e.target.value)}
            />
          </div>
        ))}
      </section>

      {/* Knowledge Base */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Knowledge Base</h2>
          <button onClick={addKnowledge} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">+ Add Entry</button>
        </div>
        {knowledge.length === 0 && <p className="text-sm text-gray-400">No entries yet.</p>}
        {knowledge.map((k, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-2 relative">
            <button onClick={() => removeKnowledge(i)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 text-xs">✕</button>
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm font-medium"
              placeholder="Title (e.g. Return Policy)"
              value={k.title}
              onChange={(e) => updateKnowledge(i, "title", e.target.value)}
            />
            <textarea
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm h-24 resize-none"
              placeholder="Content..."
              value={k.content}
              onChange={(e) => updateKnowledge(i, "content", e.target.value)}
            />
          </div>
        ))}
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  )
}
