"use client"

import { useEffect, useState } from "react"

type Settings = { one_click_checkout_enabled: boolean; saved_address_id: string | null; history_window: number }

export default function AiAssistantSettings() {
  const [settings, setSettings] = useState<Settings>({ one_click_checkout_enabled: false, saved_address_id: null, history_window: 30 })
  const [savedSettings, setSavedSettings] = useState<Settings | null>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/agent/settings").then(r => r.json()),
      fetch("/api/customers/addresses").then(r => r.json()).catch(() => ({ addresses: [] })),
    ]).then(([settingsData, addrData]) => {
      const loaded = settingsData.settings ?? { one_click_checkout_enabled: false, saved_address_id: null, history_window: 30 }
      setSettings(loaded)
      setSavedSettings(loaded)
      setAddresses(addrData.addresses ?? [])
      setLoading(false)
    })
  }, [])

  const isDirty = savedSettings !== null && (
    settings.one_click_checkout_enabled !== savedSettings.one_click_checkout_enabled ||
    settings.saved_address_id !== savedSettings.saved_address_id ||
    settings.history_window !== savedSettings.history_window
  )

  async function handleSave() {
    setSaving(true)
    await fetch("/api/agent/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSavedSettings(settings)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading…</div>
    )
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">Personalise how your AI shopping assistant behaves.</p>
      </div>

      <div className="space-y-6">
        {/* One-click checkout */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">One-click checkout</p>
              <p className="text-xs text-gray-500 mt-0.5">Place orders directly from the chat without confirmation steps</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, one_click_checkout_enabled: !s.one_click_checkout_enabled }))}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${settings.one_click_checkout_enabled ? "bg-indigo-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.one_click_checkout_enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {settings.one_click_checkout_enabled && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Default shipping address</label>
              {addresses.length === 0 ? (
                <p className="text-xs text-gray-400">No saved addresses yet. Add one in <a href="../addresses" className="text-indigo-600 hover:underline">Addresses</a>.</p>
              ) : (
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 transition-colors bg-white"
                  value={settings.saved_address_id ?? ""}
                  onChange={e => setSettings(s => ({ ...s, saved_address_id: e.target.value || null }))}
                >
                  <option value="">Select address</option>
                  {addresses.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {[a.address_1, a.city, a.country_code?.toUpperCase()].filter(Boolean).join(", ")}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Chat context window */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <label className="block text-sm font-semibold text-gray-900 mb-0.5">Chat context window</label>
          <p className="text-xs text-gray-500 mb-3">How many past messages the assistant remembers per conversation</p>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 transition-colors bg-white"
            value={settings.history_window}
            onChange={e => setSettings(s => ({ ...s, history_window: Number(e.target.value) }))}
          >
            <option value={10}>10 messages</option>
            <option value={30}>30 messages (recommended)</option>
            <option value={50}>50 messages</option>
          </select>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || (!isDirty && !justSaved)}
          className={`w-full py-3 rounded-full text-sm font-semibold transition-all ${
            justSaved && !isDirty
              ? "bg-emerald-600 text-white cursor-default"
              : isDirty
              ? "bg-gray-900 text-white hover:bg-gray-700"
              : "bg-gray-100 text-gray-400 cursor-default"
          }`}
        >
          {saving ? "Saving…" : justSaved && !isDirty ? "Saved ✓" : "Save Settings"}
        </button>
      </div>
    </div>
  )
}
