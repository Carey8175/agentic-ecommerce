"use client"

import { useEffect, useState } from "react"

type Settings = { one_click_checkout_enabled: boolean; saved_address_id: string | null; history_window: number }

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({ one_click_checkout_enabled: false, saved_address_id: null, history_window: 30 })
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/agent/settings").then(r => r.json()),
      fetch("/api/customers/addresses").then(r => r.json()).catch(() => ({ addresses: [] })),
    ]).then(([settingsData, addrData]) => {
      if (settingsData.settings) setSettings(settingsData.settings)
      setAddresses(addrData.addresses ?? [])
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch("/api/agent/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Loading...</div>

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Agent Settings</p>

      {/* One-click checkout */}
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">One-click checkout</p>
            <p className="text-[10px] text-white/30">Place orders directly from the chat</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, one_click_checkout_enabled: !s.one_click_checkout_enabled }))}
            className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors ${settings.one_click_checkout_enabled ? "bg-indigo-500" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.one_click_checkout_enabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </label>

        {settings.one_click_checkout_enabled && addresses.length > 0 && (
          <div>
            <p className="text-xs text-white/50 mb-1.5">Saved shipping address</p>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
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
          </div>
        )}
      </div>

      {/* History window */}
      <div>
        <p className="text-xs text-white/50 mb-1.5">Chat context window</p>
        <select
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none"
          value={settings.history_window}
          onChange={e => setSettings(s => ({ ...s, history_window: Number(e.target.value) }))}
        >
          <option value={10}>10 messages</option>
          <option value={30}>30 messages</option>
          <option value={50}>50 messages</option>
        </select>
        <p className="text-[10px] text-white/20 mt-1">How many past messages the agent remembers per conversation</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
      </button>
    </div>
  )
}
